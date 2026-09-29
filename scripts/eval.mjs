#!/usr/bin/env node
// Runs eval suites against agent CLIs headlessly: every trial gets a fresh Git workspace with the q
// skills installed the way the skills CLI lays them out, runs one arm (host, model, effort), and is
// graded by programmatic checks and a judge from another model family. Results and transcripts go
// outside the repository (default ~/.cache/q-evals). Method: evals/README.md. Spends model usage;
// Node 20+, no dependencies.
//
// Usage:
//   node scripts/eval.mjs run <suite> [--arms a,b] [--reps N] [--split train|test|all] [--cases a,b]
//        [--concurrency N] [--skills <dir> | --skills-rev <rev>] [--label L] [--out <dir>]
//        [--judge-votes N] [--keep] [--dry-run] [--yes] [--resume <run-dir>]
//   node scripts/eval.mjs report <run-dir>
//   node scripts/eval.mjs compare <before-run-dir> <after-run-dir> [--metric pass|score]
//   node scripts/eval.mjs regrade <run-dir> [--cases a,b] [--sample N] [--votes N] [--apply] [--dry-run]
//   node scripts/eval.mjs split <suite> [--extend] [--strata N] [--seed N] [--test-fraction F] [--force]
// <suite> is a directory holding suite.json, or the name of one under evals/.

import { spawn, spawnSync } from "node:child_process"
import {
  appendFileSync,
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { homedir, tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { gradeOne, judgePrompt, parseJudge, score } from "./eval/grade.mjs"
import { baseEnvironment, HOSTS } from "./eval/hosts.mjs"
import { caseMean, decide, mean, pairedDelta, random, seedOf, shuffle, split } from "./eval/stats.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CONFIRM_ABOVE = 30

function fail(message) {
  console.error(`eval: ${message}`)
  process.exit(1)
}

function parseArguments(argv) {
  const positional = []
  const flags = {}
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (!argument.startsWith("--")) {
      positional.push(argument)
      continue
    }

    const name = argument.slice(2)
    const next = argv[index + 1]
    if (next === undefined || next.startsWith("--")) {
      flags[name] = true
    } else {
      flags[name] = next
      index++
    }
  }

  return { positional, flags }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options })
}

// --- suites -------------------------------------------------------------------------------------

export function loadSuite(spec) {
  const direct = resolve(spec)
  const dir = existsSync(join(direct, "suite.json")) ? direct : join(ROOT, "evals", spec)
  if (!existsSync(join(dir, "suite.json"))) {
    fail(`no suite.json in ${spec} or evals/${spec}`)
  }

  const suite = { reps: 3, timeoutSeconds: 900, skills: "all", graders: [], ...readJson(join(dir, "suite.json")) }
  suite.dir = dir
  suite.name ??= basename(dir)
  suite.cases = loadCases(suite)
  suite.split = existsSync(join(dir, "split.json")) ? readJson(join(dir, "split.json")) : null
  for (const [name, arm] of Object.entries(suite.arms ?? {})) {
    if (!HOSTS[arm.host]) {
      fail(`arm ${name}: unknown host ${arm.host}`)
    }
  }

  return suite
}

function loadCases(suite) {
  const cases = []
  const listed = join(suite.dir, "cases.json")
  if (existsSync(listed)) {
    for (const entry of readJson(listed)) {
      cases.push({ dir: suite.dir, ...entry })
    }
  }

  const casesDir = join(suite.dir, "cases")
  if (existsSync(casesDir)) {
    for (const entry of readdirSync(casesDir, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(casesDir, entry.name, "case.json"))) {
        const dir = join(casesDir, entry.name)
        cases.push({ id: entry.name, dir, ...readJson(join(dir, "case.json")) })
      }
    }
  }

  const seen = new Set()
  for (const entry of cases) {
    if (!entry.id || seen.has(entry.id)) {
      fail(`suite ${suite.name}: missing or duplicate case id ${entry.id}`)
    }

    seen.add(entry.id)
    entry.tags ??= []
    entry.graders = [...(entry.graders ?? []), ...suite.graders]
    if (entry.graders.length === 0) {
      fail(`case ${entry.id}: no graders`)
    }
  }

  return cases.sort((left, right) => left.id.localeCompare(right.id))
}

/** The prompt with {{case:path}}, {{suite:path}}, and {{skills:path}} replaced by file contents. */
function renderPrompt(entry, suite, skillsDir) {
  const text = entry.promptFile ? readFileSync(join(entry.dir, entry.promptFile), "utf8") : entry.prompt
  if (typeof text !== "string" || text.trim() === "") {
    fail(`case ${entry.id}: no prompt`)
  }

  const roots = { case: entry.dir, suite: suite.dir, skills: skillsDir }
  return text.replace(/\{\{(case|suite|skills):([^}]+)\}\}/g, (_, root, path) =>
    readFileSync(join(roots[root], path.trim()), "utf8").trimEnd(),
  )
}

// --- workspaces ---------------------------------------------------------------------------------

function gitEnvironment(emptyConfig) {
  return {
    GIT_AUTHOR_NAME: "q eval",
    GIT_AUTHOR_EMAIL: "eval@example.com",
    GIT_COMMITTER_NAME: "q eval",
    GIT_COMMITTER_EMAIL: "eval@example.com",
    GIT_CONFIG_GLOBAL: emptyConfig,
    GIT_CONFIG_NOSYSTEM: "1",
  }
}

function skillNames(entry, suite, skillsDir) {
  const wanted = entry.skills ?? suite.skills
  if (wanted === "none") {
    return []
  }

  if (wanted === "all") {
    return readdirSync(skillsDir, { withFileTypes: true })
      .filter((item) => item.isDirectory() && existsSync(join(skillsDir, item.name, "SKILL.md")))
      .map((item) => item.name)
  }

  return wanted
}

/** A fresh repository with the skills installed and committed, then the case's own setup. */
function prepareWorkspace(entry, suite, skillsDir, environment) {
  const work = mkdtempSync(join(tmpdir(), "q-eval-work-"))
  const git = (...args) => run("git", args, { cwd: work, env: environment })
  git("init", "-q", "-b", "main")
  for (const name of skillNames(entry, suite, skillsDir)) {
    cpSync(join(skillsDir, name), join(work, ".agents", "skills", name), { recursive: true, dereference: true })
    mkdirSync(join(work, ".claude", "skills"), { recursive: true })
    symlinkSync(join("..", "..", ".agents", "skills", name), join(work, ".claude", "skills", name))
  }

  const config = entry.config ?? suite.config
  if (config) {
    mkdirSync(join(work, ".agents", "q"), { recursive: true })
    cpSync(join(entry.config ? entry.dir : suite.dir, config), join(work, ".agents", "q", "config.yaml"))
  }

  git("add", "-A")
  if (git("diff", "--cached", "--quiet").status !== 0) {
    git("commit", "-q", "--no-gpg-sign", "-m", "Install the q skill suite")
  }

  const setup = entry.setup ?? suite.setup
  if (setup) {
    const result = run("sh", ["-c", setup], {
      cwd: work,
      env: { ...environment, CASE_DIR: entry.dir, SUITE_DIR: suite.dir, SKILLS_DIR: skillsDir },
    })
    if (result.status !== 0) {
      return { work, error: `setup failed (exit ${result.status}): ${(result.stderr || result.stdout).slice(-400)}` }
    }
  }

  return { work, error: null }
}

function workspaceSummary(work, environment) {
  const git = (...args) => run("git", args, { cwd: work, env: environment }).stdout ?? ""
  return [
    "$ git status --porcelain",
    git("status", "--porcelain"),
    "$ git log --oneline -10",
    git("log", "--oneline", "-10"),
    "$ git diff HEAD",
    git("diff", "HEAD").slice(0, 200_000),
  ].join("\n")
}

// --- agents -------------------------------------------------------------------------------------

/** Runs one agent CLI, streaming its JSON lines through the host parser; `stop` may end it early. */
function runAgent({ host, command, cwd, environment, timeoutMs, streamPath, stderrPath, stop }) {
  return new Promise((resolvePromise) => {
    const started = Date.now()
    const state = host.start()
    const events = []
    const out = createWriteStream(streamPath)
    const err = createWriteStream(stderrPath)
    let buffer = ""
    let timedOut = false
    let stopped = null
    let spawnError = null
    const child = spawn(host.bin, command.args, {
      cwd,
      env: { ...environment, ...command.env },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    })
    const kill = (signal) => {
      try {
        process.kill(-child.pid, signal)
      } catch {
        // Already gone.
      }
    }
    const end = () => {
      kill("SIGTERM")
      setTimeout(() => kill("SIGKILL"), 5000).unref()
    }
    const timer = setTimeout(() => {
      timedOut = true
      end()
    }, timeoutMs)

    const consume = (line) => {
      let record
      try {
        record = JSON.parse(line)
      } catch {
        return
      }

      events.push(...host.line(state, record))
      if (!stopped && stop) {
        stopped = stop(events)
        if (stopped) {
          end()
        }
      }
    }

    child.stdout.on("data", (chunk) => {
      out.write(chunk)
      buffer += chunk
      for (let newline = buffer.indexOf("\n"); newline !== -1; newline = buffer.indexOf("\n")) {
        consume(buffer.slice(0, newline))
        buffer = buffer.slice(newline + 1)
      }
    })
    child.stderr.on("data", (chunk) => err.write(chunk))
    child.on("error", (error) => {
      spawnError = error.message
    })
    child.on("close", (code, signal) => {
      clearTimeout(timer)
      if (buffer.trim()) {
        consume(buffer)
      }

      out.end()
      err.end()
      resolvePromise({
        code,
        signal,
        timedOut,
        stopped,
        spawnError,
        durationMs: Date.now() - started,
        events,
        ...host.finish(state),
      })
    })
  })
}

/**
 * When to end a run early: `onSkill` (true, or a pattern for the skill name) once a skill loads, and
 * `afterTools` after that many tool calls. A case's `stop` replaces the suite's; null runs to the end.
 */
function stopRule(rule) {
  if (!rule) {
    return null
  }

  const skill = typeof rule.onSkill === "string" ? new RegExp(rule.onSkill) : rule.onSkill ? /./ : null
  return (events) => {
    const loaded = skill && events.find((event) => event.kind === "skill" && skill.test(event.name))
    if (loaded) {
      return `${loaded.name} loaded`
    }

    const work = events.filter((event) => ["command", "read", "write", "search", "tool", "agent"].includes(event.kind))
    if (rule.afterTools && work.length >= rule.afterTools) {
      return `${rule.afterTools} tool calls without a skill`
    }

    return null
  }
}

function modelMismatch(requested, observed) {
  // An alias (opus, sonnet) resolves to a dated ID; only a full ID is checked.
  if (!/\d/.test(requested) || observed.length === 0) {
    return null
  }

  const wrong = observed.filter((model) => !model.startsWith(requested))
  return wrong.length > 0 ? `requested ${requested}, answered by ${wrong.join(", ")}` : null
}

// --- trials -------------------------------------------------------------------------------------

async function judgeTrial({ suite, entry, arm, trial, trialDir, context, votes, environment }) {
  const graders = entry.graders.filter((grader) => grader.type === "judge")
  if (graders.length === 0) {
    return { verdicts: new Map(), usage: [] }
  }

  const judgeArm = suite.judges?.[arm.host]
  if (!judgeArm) {
    const missing = { passed: null, detail: `no judge for ${arm.host}` }
    return { verdicts: new Map(graders.map((grader) => [grader.name, missing])), usage: [] }
  }

  const prompt = judgePrompt(graders, trial, context)
  const ballots = []
  const usage = []
  for (let vote = 0; vote < votes; vote++) {
    // One re-ask when an answer cannot be parsed, then the vote is lost.
    for (let attempt = 0; attempt < 2; attempt++) {
      const cwd = mkdtempSync(join(tmpdir(), "q-eval-judge-"))
      const host = HOSTS[judgeArm.host]
      const base = join(trialDir, `judge-${vote + 1}-${attempt + 1}`)
      const answer = await runAgent({
        host,
        command: host.command({ prompt, ...judgeArm, cwd, sandbox: "read-only", maxTurns: 3 }),
        cwd,
        environment,
        timeoutMs: 300_000,
        streamPath: `${base}.jsonl`,
        stderrPath: `${base}.stderr`,
      })
      rmSync(cwd, { recursive: true, force: true })
      usage.push(answer.usage)
      writeFileSync(`${base}.txt`, `${prompt}\n\n=== answer ===\n${answer.final}\n`)
      const verdicts = parseJudge(answer.final, graders)
      if (verdicts) {
        ballots.push(verdicts)
        break
      }
    }
  }

  const verdicts = new Map()
  for (const grader of graders) {
    const votesFor = ballots.map((ballot) => ballot.get(grader.name))
    if (votesFor.length === 0) {
      verdicts.set(grader.name, { passed: null, detail: "judge answers unusable" })
      continue
    }

    const passes = votesFor.filter((verdict) => verdict.pass).length
    const passed = passes * 2 > votesFor.length
    verdicts.set(grader.name, {
      passed,
      detail: votesFor.map((verdict) => `${verdict.pass ? "PASS" : "FAIL"}: ${verdict.evidence}`).join(" | "),
      agreement: votesFor.length > 1 ? passes === 0 || passes === votesFor.length : null,
    })
  }

  return { verdicts, usage }
}

async function runTrial({ suite, entry, armName, arm, rep, runDir, skillsDir, options, environment }) {
  const id = `${entry.id}__${armName}__r${rep}`
  const trialDir = join(runDir, "trials", id)
  const resultPath = join(trialDir, "result.json")
  if (existsSync(resultPath)) {
    return readJson(resultPath)
  }

  mkdirSync(trialDir, { recursive: true })
  const base = {
    case: entry.id,
    tags: entry.tags,
    arm: armName,
    host: arm.host,
    model: arm.model,
    effort: arm.effort,
    rep,
    trial: id,
  }
  const { work, error: setupError } = prepareWorkspace(entry, suite, skillsDir, environment)
  const finish = (result) => {
    writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`)
    if (!options.keep) {
      rmSync(work, { recursive: true, force: true })
    }

    return result
  }
  if (setupError) {
    return finish({ ...base, status: "setup-error", error: setupError, graders: [], score: null, passed: false })
  }

  const prompt = renderPrompt(entry, suite, skillsDir)
  writeFileSync(join(trialDir, "prompt.txt"), prompt)
  const host = HOSTS[arm.host]
  const outcome = await runAgent({
    host,
    command: host.command({
      prompt,
      model: arm.model,
      effort: arm.effort,
      cwd: work,
      sandbox: entry.sandbox ?? suite.sandbox,
      maxTurns: entry.maxTurns ?? suite.maxTurns,
    }),
    cwd: work,
    environment,
    timeoutMs: (entry.timeoutSeconds ?? suite.timeoutSeconds) * 1000,
    streamPath: join(trialDir, "stream.jsonl"),
    stderrPath: join(trialDir, "stderr.txt"),
    stop: stopRule(entry.stop === undefined ? suite.stop : entry.stop),
  })
  writeFileSync(join(trialDir, "events.jsonl"), outcome.events.map((event) => JSON.stringify(event)).join("\n"))
  writeFileSync(join(trialDir, "final.txt"), outcome.final ?? "")
  writeFileSync(join(trialDir, "workspace.txt"), workspaceSummary(work, environment))

  const mismatch = modelMismatch(arm.model, outcome.models)
  let status = "ok"
  let error = null
  if (outcome.spawnError) {
    status = "error"
    error = outcome.spawnError
  } else if (mismatch) {
    status = "model-mismatch"
    error = mismatch
  } else if (outcome.timedOut) {
    status = "timeout"
  } else if (outcome.stopped) {
    status = "stopped"
  } else if (outcome.error || (outcome.code !== 0 && !outcome.final)) {
    status = "error"
    error = outcome.error ?? `exit ${outcome.code}`
  }

  const trial = {
    final: outcome.final ?? "",
    events: outcome.events,
    workspace: work,
    checkEnvironment: { ...environment, CASE_DIR: entry.dir, SUITE_DIR: suite.dir },
  }
  const graded = []
  let judgeUsage = []
  if (status === "ok" || status === "stopped" || status === "timeout") {
    const context = entry.judgeContext
      ? run("sh", ["-c", entry.judgeContext], { cwd: work, env: trial.checkEnvironment }).stdout
      : null
    const judged = await judgeTrial({
      suite,
      entry,
      arm,
      trial,
      trialDir,
      context,
      votes: Number(options["judge-votes"] ?? suite.judgeVotes ?? 1),
      environment,
    })
    judgeUsage = judged.usage
    for (const grader of entry.graders) {
      const verdict = grader.type === "judge" ? judged.verdicts.get(grader.name) : gradeOne(grader, trial)
      graded.push({ name: grader.name, type: grader.type, weight: grader.weight ?? 1, ...verdict })
    }
  }

  const scored = graded.length > 0 ? score(graded) : { score: null, passed: false, ungraded: 0 }
  return finish({
    ...base,
    status,
    error,
    stopped: outcome.stopped,
    durationMs: outcome.durationMs,
    turns: outcome.turns,
    sessionId: outcome.sessionId,
    observedModels: outcome.models,
    usage: outcome.usage,
    judgeUsage,
    graders: graded,
    ...scored,
  })
}

async function pool(items, concurrency, worker) {
  const results = []
  let next = 0
  const lanes = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(lanes)
  return results
}

/** A scratch directory and the environment every agent and judge run starts from. */
function runEnvironment() {
  const scratch = mkdtempSync(join(tmpdir(), "q-eval-run-"))
  const emptyConfig = join(scratch, "gitconfig")
  writeFileSync(emptyConfig, "")
  return { scratch, environment: { ...baseEnvironment(), ...gitEnvironment(emptyConfig) } }
}

function hostVersion(bin) {
  const result = run(bin, ["--version"])
  return result.status === 0 ? result.stdout.trim().split("\n")[0] : null
}

function exportSkills(rev, into) {
  const archive = run("git", ["-C", ROOT, "archive", "--format=tar", rev, "skills"], { encoding: "buffer" })
  if (archive.status !== 0) {
    fail(`git archive ${rev} failed: ${archive.stderr}`)
  }

  const extract = spawnSync("tar", ["-x", "-C", into], { input: archive.stdout })
  if (extract.status !== 0) {
    fail(`could not extract skills at ${rev}`)
  }

  return join(into, "skills")
}

function selectCases(suite, flags) {
  let cases = suite.cases
  if (flags.cases) {
    const wanted = new Set(String(flags.cases).split(","))
    cases = cases.filter((entry) => wanted.has(entry.id) || entry.tags.some((tag) => wanted.has(tag)))
  }

  const part = flags.split ?? "all"
  if (part !== "all") {
    if (!suite.split) {
      fail(`--split ${part} needs ${suite.name}/split.json: run \`node scripts/eval.mjs split ${suite.name}\``)
    }

    const members = new Set(suite.split[part] ?? fail(`unknown split ${part}`))
    cases = cases.filter((entry) => members.has(entry.id))
  }

  if (cases.length === 0) {
    fail("no cases selected")
  }

  return cases
}

async function runCommand(positional, flags) {
  const suite = loadSuite(positional[0] ?? fail("run needs a suite"))
  const armNames = flags.arms ? String(flags.arms).split(",") : suite.defaultArms ?? Object.keys(suite.arms ?? {})
  const arms = Object.fromEntries(armNames.map((name) => [name, suite.arms?.[name] ?? fail(`unknown arm ${name}`)]))
  for (const [name, arm] of Object.entries(arms)) {
    const judge = suite.judges?.[arm.host]
    if (judge && HOSTS[judge.host].family === HOSTS[arm.host].family) {
      fail(`arm ${name}: its judge must come from another model family than ${arm.host}`)
    }
  }

  const cases = selectCases(suite, flags)
  const reps = Number(flags.reps ?? suite.reps)
  const trials = []
  for (const entry of cases) {
    for (const armName of armNames) {
      for (let rep = 1; rep <= reps; rep++) {
        trials.push({ entry, armName, arm: arms[armName], rep })
      }
    }
  }

  const judged = cases.some((entry) => entry.graders.some((grader) => grader.type === "judge"))
  const label = String(flags.label ?? "run")
  console.log(
    `eval: ${suite.name}: ${cases.length} cases x ${armNames.length} arms (${armNames.join(", ")}) x ${reps} reps` +
      ` = ${trials.length} trials${judged ? ", each judged" : ""}`,
  )
  if (flags["dry-run"]) {
    for (const trial of trials) {
      console.log(`  ${trial.entry.id} ${trial.armName} r${trial.rep}`)
    }

    return
  }

  if (trials.length > CONFIRM_ABOVE && !flags.yes) {
    fail(`${trials.length} trials spend real usage; rerun with --yes to confirm`)
  }

  const { scratch, environment } = runEnvironment()
  let skillsDir = resolve(String(flags.skills ?? join(ROOT, "skills")))
  let skillsRev = run("git", ["-C", ROOT, "rev-parse", "HEAD"]).stdout.trim()
  let skillsDirty = run("git", ["-C", ROOT, "status", "--porcelain", "--", "skills"]).stdout.trim() !== ""
  if (flags["skills-rev"]) {
    skillsDir = exportSkills(String(flags["skills-rev"]), scratch)
    skillsRev = run("git", ["-C", ROOT, "rev-parse", String(flags["skills-rev"])]).stdout.trim()
    skillsDirty = false
  } else if (flags.skills) {
    skillsRev = null
    skillsDirty = null
  }

  const out = resolve(String(flags.out ?? process.env.Q_EVALS_HOME ?? join(homedir(), ".cache", "q-evals")))
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const runDir = flags.resume ? resolve(String(flags.resume)) : join(out, suite.name, `${stamp}-${label}`)
  mkdirSync(join(runDir, "trials"), { recursive: true })
  const meta = {
    suite: suite.name,
    suiteDir: suite.dir,
    label,
    started: new Date().toISOString(),
    cases: cases.map((entry) => entry.id),
    split: flags.split ?? "all",
    reps,
    arms,
    judges: suite.judges ?? null,
    skills: { dir: flags["skills-rev"] ? null : skillsDir, rev: skillsRev, dirty: skillsDirty },
    harness: run("git", ["-C", ROOT, "rev-parse", "HEAD"]).stdout.trim(),
    hosts: Object.fromEntries(
      [...new Set([...Object.values(arms), ...Object.values(suite.judges ?? {})].map((arm) => arm.host))].map(
        (host) => [host, hostVersion(HOSTS[host].bin)],
      ),
    ),
  }
  writeFileSync(join(runDir, "run.json"), `${JSON.stringify(meta, null, 2)}\n`)
  console.log(`eval: writing ${runDir}`)

  // Interleave arms and cases so provider load and time of day spread evenly.
  const order = shuffle(trials, random(seedOf(`${suite.name}:${label}`)))
  let done = 0
  await pool(order, Number(flags.concurrency ?? 2), async (trial) => {
    const result = await runTrial({ suite, ...trial, runDir, skillsDir, options: flags, environment })
    appendFileSync(join(runDir, "results.jsonl"), `${JSON.stringify(result)}\n`)
    done++
    const mark = result.status !== "ok" && result.status !== "stopped" ? result.status : result.passed ? "pass" : "fail"
    console.log(`eval: [${done}/${order.length}] ${result.trial} ${mark}${result.error ? ` (${result.error})` : ""}`)
  })

  meta.finished = new Date().toISOString()
  writeFileSync(join(runDir, "run.json"), `${JSON.stringify(meta, null, 2)}\n`)
  rmSync(scratch, { recursive: true, force: true })
  console.log(reportText(runDir))
}

// --- reports ------------------------------------------------------------------------------------

/** One row per trial; a resumed run keeps the latest result for each trial. */
export function loadResults(runDir) {
  const path = join(runDir, "results.jsonl")
  const rows = existsSync(path)
    ? readFileSync(path, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : []
  return [...new Map(rows.map((row) => [row.trial, row])).values()]
}

const INFRA = new Set(["error", "setup-error", "model-mismatch"])

function percent(value) {
  return value === null || value === undefined ? "-" : `${Math.round(value * 100)}%`
}

function interval(value) {
  return value ? `${percent(value.mean)} [${percent(value.low)}, ${percent(value.high)}]` : "-"
}

function thousands(value) {
  return value === null || value === undefined ? "-" : `${Math.round(value / 1000)}k`
}

function table(header, rows) {
  const widths = header.map((cell, index) => Math.max(cell.length, ...rows.map((row) => String(row[index]).length)))
  const line = (row) => `| ${row.map((cell, index) => String(cell).padEnd(widths[index])).join(" | ")} |`
  return [line(header), `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`, ...rows.map(line)].join("\n")
}

const EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]

export function reportText(runDir) {
  const meta = readJson(join(runDir, "run.json"))
  const suite = existsSync(join(meta.suiteDir, "suite.json")) ? readJson(join(meta.suiteDir, "suite.json")) : {}
  const rows = loadResults(runDir)
  const lines = [
    `# ${meta.suite}: ${meta.label}`,
    "",
    `Skills ${meta.skills.rev?.slice(0, 12) ?? meta.skills.dir}${meta.skills.dirty ? " (uncommitted changes)" : ""};` +
      ` split ${meta.split}; ${meta.cases.length} cases x ${meta.reps} reps; hosts ` +
      Object.entries(meta.hosts)
        .map(([host, version]) => `${host} ${version ?? "?"}`)
        .join(", "),
    "",
  ]
  const warnings = []
  const armRows = []
  const byArm = new Map()
  for (const armName of Object.keys(meta.arms)) {
    const trials = rows.filter((row) => row.arm === armName)
    byArm.set(armName, trials)
    const graded = trials.filter((row) => !INFRA.has(row.status) && row.score !== null && row.score !== undefined)
    const pass = caseMean(graded, (row) => (row.passed ? 1 : 0))
    const scoreMean = caseMean(graded, (row) => row.score)
    const infra = trials.filter((row) => INFRA.has(row.status)).length
    const usage = (key) => mean(graded.map((row) => row.usage?.[key]).filter((value) => typeof value === "number"))
    const cost = mean(graded.map((row) => row.usage?.costUsd).filter((value) => typeof value === "number"))
    armRows.push([
      armName,
      `${graded.length}/${trials.length}`,
      interval(pass),
      interval(scoreMean),
      thousands(usage("input")),
      thousands(usage("output")),
      thousands(usage("reasoning")),
      cost === null ? "-" : `$${cost.toFixed(3)}`,
      `${Math.round(mean(graded.map((row) => row.durationMs ?? 0)) / 1000 || 0)}s`,
    ])
    if (trials.length > 0 && infra / trials.length > 0.1) {
      warnings.push(`${armName}: ${infra} of ${trials.length} trials failed to run; fix the harness before trusting it`)
    }

    const halfWidth = pass ? (pass.high - pass.low) / 2 : null
    if (suite.minEffect && halfWidth !== null && halfWidth > suite.minEffect) {
      warnings.push(
        `${armName}: noise (±${percent(halfWidth)}) exceeds the smallest effect worth acting on` +
          ` (${percent(suite.minEffect)}); add cases or reps before hillclimbing`,
      )
    }

    const ungraded = graded.reduce((sum, row) => sum + (row.ungraded ?? 0), 0)
    if (ungraded > 0) {
      warnings.push(`${armName}: ${ungraded} grader verdicts missing (judge answers unusable)`)
    }

    const disagreements = graded.flatMap((row) => row.graders).filter((grader) => grader.agreement === false)
    if (disagreements.length > 0) {
      warnings.push(`${armName}: judge votes disagreed on ${disagreements.length} verdicts; tighten those claims`)
    }
  }

  lines.push(
    table(["arm", "graded", "pass (95% CI)", "score (95% CI)", "input", "output", "reasoning", "cost", "time"], armRows),
    "",
    "Input includes cached tokens; reasoning is part of output. Cost is the CLI's list-price estimate",
    "(Claude only), not subscription consumption.",
  )

  const best = Math.max(
    ...[...byArm.values()].map(
      (trials) => caseMean(trials.filter((row) => !INFRA.has(row.status)), (row) => (row.passed ? 1 : 0))?.mean ?? 0,
    ),
  )
  if (best >= 0.95) {
    warnings.push("headroom: an arm passes 95% or more; the suite can no longer show gains, so tune for cost")
  }

  // More effort on the same model should not do worse beyond noise.
  const arms = Object.entries(meta.arms)
  for (const [low, lowArm] of arms) {
    for (const [high, highArm] of arms) {
      if (
        lowArm.host === highArm.host &&
        lowArm.model === highArm.model &&
        EFFORTS.indexOf(highArm.effort) > EFFORTS.indexOf(lowArm.effort)
      ) {
        const delta = pairedDelta(byArm.get(low), byArm.get(high), (row) =>
          INFRA.has(row.status) ? null : row.passed ? 1 : 0,
        )
        if (delta?.high < 0) {
          warnings.push(`scaling: ${high} does worse than ${low}; suspect an ambiguous case or a wrong grader`)
        }
      }
    }
  }

  const graderNames = [...new Set(rows.flatMap((row) => row.graders?.map((grader) => grader.name) ?? []))]
  if (graderNames.length > 1) {
    lines.push("", "Grader pass rates:", "")
    lines.push(
      table(
        ["grader", ...byArm.keys()],
        graderNames.map((name) => [
          name,
          ...[...byArm.values()].map((trials) => {
            const verdicts = trials
              .flatMap((row) => row.graders ?? [])
              .filter((grader) => grader.name === name && grader.passed !== null)
            return verdicts.length ? `${verdicts.filter((grader) => grader.passed).length}/${verdicts.length}` : "-"
          }),
        ]),
      ),
    )
  }

  lines.push("", "Case pass rates:", "")
  lines.push(
    table(
      ["case", ...byArm.keys()],
      meta.cases.map((name) => [
        name,
        ...[...byArm.values()].map((trials) => {
          const own = trials.filter((row) => row.case === name)
          const graded = own.filter((row) => !INFRA.has(row.status))
          const passes = graded.filter((row) => row.passed).length
          return own.length === 0 ? "-" : `${passes}/${graded.length}${graded.length < own.length ? "!" : ""}`
        }),
      ]),
    ),
  )
  lines.push("", "`!` marks cases with trials that failed to run.")
  if (warnings.length > 0) {
    lines.push("", "Warnings:", "", ...warnings.map((warning) => `- ${warning}`))
  }

  const text = lines.join("\n")
  writeFileSync(join(runDir, "report.md"), `${text}\n`)
  return text
}

function compareCommand(positional, flags) {
  const [beforeDir, afterDir] = positional.map((path) => resolve(path))
  if (!beforeDir || !afterDir) {
    fail("compare needs two run directories")
  }

  const before = loadResults(beforeDir)
  const after = loadResults(afterDir)
  const meta = readJson(join(afterDir, "run.json"))
  const splitPath = join(meta.suiteDir, "split.json")
  const parts = existsSync(splitPath) ? readJson(splitPath) : null
  const metric = flags.metric === "score" ? (row) => row.score : (row) => (row.passed ? 1 : 0)
  const value = (row) => (INFRA.has(row.status) || row.score === null ? null : metric(row))
  const rows = []
  for (const arm of Object.keys(meta.arms)) {
    const left = before.filter((row) => row.arm === arm)
    const right = after.filter((row) => row.arm === arm)
    if (left.length === 0 || right.length === 0) {
      continue
    }

    const describe = (delta) =>
      delta
        ? `${delta.delta >= 0 ? "+" : ""}${percent(delta.delta)} [${percent(delta.low)}, ${percent(delta.high)}] n=${delta.cases}`
        : "-"
    const all = pairedDelta(left, right, value)
    if (!parts) {
      rows.push([arm, describe(all), "-", "-", "no split.json: overall delta only"])
      continue
    }

    const within = (names) => (row) => names.includes(row.case)
    const train = pairedDelta(left.filter(within(parts.train)), right.filter(within(parts.train)), value)
    const test = pairedDelta(left.filter(within(parts.test)), right.filter(within(parts.test)), value)
    rows.push([arm, describe(all), describe(train), describe(test), decide(train, test)])
  }

  console.log(table(["arm", "all", "train", "test", "decision"], rows))
  console.log("\nDeltas are after minus before, per case over its repeats, with 95% bootstrap intervals over cases.")
}

/**
 * Re-judges stored final messages with the run's own judges and the suite's current claims, and
 * reports how often a verdict changes: a judge that disagrees with itself on identical output cannot
 * rank arms. `--apply` writes the new verdicts into the run (after a claim was reworded), keeping the
 * previous results beside it.
 */
async function regradeCommand(positional, flags) {
  const runDir = resolve(positional[0] ?? fail("regrade needs a run directory"))
  const meta = readJson(join(runDir, "run.json"))
  const suite = { ...loadSuite(meta.suiteDir), judges: meta.judges ?? undefined }
  const cases = new Map(suite.cases.map((entry) => [entry.id, entry]))
  const wanted = flags.cases ? new Set(String(flags.cases).split(",")) : null
  const judged = (row) => row.graders?.some((grader) => grader.type === "judge" && grader.passed !== null)
  const all = loadResults(runDir)
  const rows = all.filter(
    (row) =>
      judged(row) &&
      cases.has(row.case) &&
      !cases.get(row.case).judgeContext &&
      (!wanted || wanted.has(row.case)),
  )
  const sample = shuffle(rows, random(Number(flags.seed ?? 1))).slice(0, Number(flags.sample ?? rows.length))
  console.log(`eval: regrading ${sample.length} of ${rows.length} judged trials in ${runDir}`)
  if (flags["dry-run"]) {
    return
  }

  const { scratch, environment } = runEnvironment()
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const flips = []
  let compared = 0
  await pool(sample, Number(flags.concurrency ?? 2), async (row) => {
    const trialDir = join(runDir, "trials", row.trial, `regrade-${stamp}`)
    mkdirSync(trialDir, { recursive: true })
    const final = readFileSync(join(runDir, "trials", row.trial, "final.txt"), "utf8")
    const { verdicts } = await judgeTrial({
      suite,
      entry: cases.get(row.case),
      arm: meta.arms[row.arm],
      trial: { final },
      trialDir,
      context: null,
      votes: Number(flags.votes ?? 1),
      environment,
    })
    for (const grader of row.graders.filter((item) => item.type === "judge" && item.passed !== null)) {
      const again = verdicts.get(grader.name)
      if (!again || again.passed === null) {
        continue
      }

      compared++
      if (again.passed !== grader.passed) {
        flips.push({ trial: row.trial, claim: grader.name, before: grader.passed, after: again.passed, detail: again.detail })
      }

      if (flags.apply) {
        Object.assign(grader, { passed: again.passed, detail: again.detail, regraded: stamp })
      }
    }

    if (flags.apply) {
      Object.assign(row, score(row.graders))
      writeFileSync(join(runDir, "trials", row.trial, "result.json"), `${JSON.stringify(row, null, 2)}\n`)
    }
  })
  rmSync(scratch, { recursive: true, force: true })
  if (flags.apply) {
    cpSync(join(runDir, "results.jsonl"), join(runDir, `results.before-regrade-${stamp}.jsonl`))
    writeFileSync(join(runDir, "results.jsonl"), all.map((row) => `${JSON.stringify(row)}\n`).join(""))
    reportText(runDir)
  }
  writeFileSync(join(runDir, `regrade-${stamp}.json`), `${JSON.stringify({ compared, flips }, null, 2)}\n`)
  console.log(`eval: ${compared} verdicts re-judged, ${flips.length} changed (${percent(compared ? flips.length / compared : null)})`)
  for (const flip of flips) {
    const verdict = (passed) => (passed ? "PASS" : "FAIL")
    console.log(`  ${flip.trial} ${flip.claim}: ${verdict(flip.before)} -> ${verdict(flip.after)}: ${flip.detail.slice(0, 200)}`)
  }
}

/**
 * Writes the suite's fixed train/test split. `--extend` assigns only cases the split does not name
 * yet, leaving every earlier assignment alone, and records the extension; run it before any run of
 * the change under test.
 */
function splitCommand(positional, flags) {
  const suite = loadSuite(positional[0] ?? fail("split needs a suite"))
  const path = join(suite.dir, "split.json")
  const options = { testFraction: Number(flags["test-fraction"] ?? 0.4), strata: Number(flags.strata ?? 1) }
  if (flags.extend) {
    if (!suite.split) {
      fail(`--extend needs an existing ${path}`)
    }

    const assigned = new Set([...suite.split.train, ...suite.split.test])
    const added = suite.cases.filter((entry) => !assigned.has(entry.id))
    if (added.length === 0) {
      fail("every case already has a split")
    }

    const seed = Number(flags.seed ?? seedOf(`${suite.name}:${added.map((entry) => entry.id).join(",")}`))
    const extension = { date: new Date().toISOString().slice(0, 10), ...split(added, { seed, ...options }) }
    const result = {
      ...suite.split,
      train: [...suite.split.train, ...extension.train].sort(),
      test: [...suite.split.test, ...extension.test].sort(),
      extensions: [...(suite.split.extensions ?? []), extension],
    }
    writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`)
    console.log(`eval: ${suite.name}: added ${extension.train.length} train, ${extension.test.length} test -> ${path}`)
    return
  }

  if (existsSync(path) && !flags.force) {
    fail(`${path} exists; a split is fixed once (pass --extend for new cases, or --force to restart hillclimbing)`)
  }

  const result = split(suite.cases, { seed: Number(flags.seed ?? seedOf(suite.name)), ...options })
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`)
  console.log(`eval: ${suite.name}: ${result.train.length} train, ${result.test.length} test -> ${path}`)
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { positional, flags } = parseArguments(process.argv.slice(2))
  const command = positional.shift()
  if (command === "run") {
    await runCommand(positional, flags)
  } else if (command === "report") {
    console.log(reportText(resolve(positional[0] ?? fail("report needs a run directory"))))
  } else if (command === "compare") {
    compareCommand(positional, flags)
  } else if (command === "regrade") {
    await regradeCommand(positional, flags)
  } else if (command === "split") {
    splitCommand(positional, flags)
  } else {
    fail("usage: eval.mjs run|report|compare|split ... (see the header of scripts/eval.mjs)")
  }
}

