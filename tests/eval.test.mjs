import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { describe, test } from "node:test"
import { fileURLToPath } from "node:url"
import { extractJson, gradeOne, judgePrompt, parseJudge, score } from "../scripts/eval/grade.mjs"
import { baseEnvironment, HOSTS, skillsRead } from "../scripts/eval/hosts.mjs"
import { caseMean, decide, pairedDelta, random, split } from "../scripts/eval/stats.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function rows(arm, outcomes) {
  return Object.entries(outcomes).flatMap(([name, passes]) =>
    passes.map((passed, rep) => ({ case: name, arm, rep, passed, score: passed ? 1 : 0 })),
  )
}

describe("stats", () => {
  test("the seeded generator reproduces", () => {
    const first = random(7)
    const second = random(7)
    assert.deepEqual([first(), first(), first()], [second(), second(), second()])
  })

  test("a split is stratified by first tag, fixed by its seed, and covers every case once", () => {
    const cases = [
      ...Array.from({ length: 5 }, (_, index) => ({ id: `a${index}`, tags: ["alpha"] })),
      ...Array.from({ length: 5 }, (_, index) => ({ id: `b${index}`, tags: ["beta"] })),
      { id: "solo", tags: ["gamma"] },
    ]
    const result = split(cases, { seed: 3, testFraction: 0.4 })
    assert.deepEqual(result, split([...cases].reverse(), { seed: 3, testFraction: 0.4 }))
    assert.equal(result.test.filter((id) => id.startsWith("a")).length, 2)
    assert.equal(result.test.filter((id) => id.startsWith("b")).length, 2)
    assert.ok(result.train.includes("solo"), "a one-case stratum stays in train")
    assert.deepEqual([...result.train, ...result.test].sort(), cases.map((entry) => entry.id).sort())
  })

  test("a split can stratify by more than the first tag", () => {
    const cases = [
      ...Array.from({ length: 3 }, (_, index) => ({ id: `d${index}`, tags: ["defect", "docs"] })),
      ...Array.from({ length: 3 }, (_, index) => ({ id: `b${index}`, tags: ["defect", "behavior"] })),
    ]
    const result = split(cases, { seed: 5, testFraction: 0.4, strata: 2 })
    assert.equal(result.test.filter((id) => id.startsWith("d")).length, 1)
    assert.equal(result.test.filter((id) => id.startsWith("b")).length, 1)
  })

  test("case means average repeats before resampling cases", () => {
    const result = caseMean(rows("x", { one: [true, true, false, false], two: [true] }), (row) =>
      row.passed ? 1 : 0,
    )
    assert.equal(result.mean, 0.75)
    assert.equal(result.cases, 2)
  })

  test("paired deltas compare the same cases and flag intervals that exclude zero", () => {
    const before = rows("x", { a: [false, false], b: [false, true], c: [false, false], d: [true, false] })
    const after = rows("x", { a: [true, true], b: [true, true], c: [true, true], d: [true, true], extra: [true] })
    const delta = pairedDelta(before, after, (row) => (row.passed ? 1 : 0))
    assert.equal(delta.cases, 4)
    assert.equal(delta.delta, 0.75)
    assert.ok(delta.significant)
    assert.equal(pairedDelta(before, before, (row) => (row.passed ? 1 : 0)).significant, false)
  })

  test("a change is kept only when train and test both improve", () => {
    const up = { delta: 0.2, low: 0.05, high: 0.35, significant: true }
    const noisyUp = { delta: 0.1, low: -0.05, high: 0.25, significant: false }
    const flat = { delta: 0, low: -0.1, high: 0.1, significant: false }
    const down = { delta: -0.3, low: -0.5, high: -0.1, significant: true }
    assert.match(decide(up, up), /^keep/)
    assert.match(decide(up, noisyUp), /^undecided/)
    assert.match(decide(up, flat), /overfitting/)
    assert.match(decide(flat, up), /no train gain/)
    assert.match(decide(up, down), /regressed/)
  })
})

describe("graders", () => {
  const trial = {
    final: 'Review done.\n```json\n{"status": "CONTINUE", "summary": "s", "evidence": ["e"], "coverage": []}\n```',
    events: [
      { kind: "skill", name: "q-code-quality", via: "tool" },
      { kind: "command", text: "git diff baseline..HEAD" },
      { kind: "command", text: "npm test" },
    ],
  }

  test("extracts the last fenced or balanced JSON object", () => {
    assert.equal(extractJson(trial.final).status, "CONTINUE")
    assert.deepEqual(extractJson('noise {"a": {"b": "}"}} tail'), { a: { b: "}" } })
    assert.equal(extractJson("no json here"), null)
  })

  test("json graders check required keys, enums, and non-empty arrays", () => {
    const grader = { type: "json", required: ["status", "coverage"], enum: { status: ["CONTINUE", "BLOCKED"] } }
    assert.equal(gradeOne(grader, trial).passed, true)
    assert.equal(gradeOne({ ...grader, enum: { status: ["READY"] } }, trial).passed, false)
    assert.equal(gradeOne({ type: "json", nonEmpty: ["coverage"] }, trial).passed, false)
  })

  test("event graders count matching events within bounds", () => {
    assert.equal(gradeOne({ type: "events", kind: "skill", pattern: "^q-code-quality$" }, trial).passed, true)
    assert.equal(gradeOne({ type: "events", kind: "command", pattern: "git push", min: 0, max: 0 }, trial).passed, true)
    assert.equal(gradeOne({ type: "events", kind: "command", max: 1 }, trial).passed, false)
  })

  test("final graders match or forbid a pattern", () => {
    assert.equal(gradeOne({ type: "final", pattern: "review done", flags: "i" }, trial).passed, true)
    assert.equal(gradeOne({ type: "final", pattern: "READY", match: "absent" }, trial).passed, true)
  })

  test("check graders run in the workspace", () => {
    const workspace = mkdtempSync(join(tmpdir(), "q-eval-test-"))
    try {
      writeFileSync(join(workspace, "marker"), "")
      const withWorkspace = { ...trial, workspace, checkEnvironment: process.env }
      assert.equal(gradeOne({ type: "check", run: "test -f marker" }, withWorkspace).passed, true)
      assert.equal(gradeOne({ type: "check", run: "test -f missing" }, withWorkspace).passed, false)
    } finally {
      rmSync(workspace, { recursive: true, force: true })
    }
  })

  test("judge answers need a verdict for every claim", () => {
    const graders = [
      { name: "D1", type: "judge", claim: "finds one" },
      { name: "D2", type: "judge", claim: "finds two" },
    ]
    const prompt = judgePrompt(graders, trial, "diff")
    assert.match(prompt, /- D1: finds one/)
    assert.match(prompt, /<<<CONTEXT\ndiff\nCONTEXT>>>/)
    const answer = '{"claims": [{"id": "D1", "pass": true, "evidence": "x"}, {"id": "D2", "pass": false}]}'
    assert.equal(parseJudge(answer, graders).get("D2").pass, false)
    assert.equal(parseJudge('{"claims": [{"id": "D1", "pass": true}]}', graders), null)
  })

  test("scores weight graders and leave unusable verdicts ungraded", () => {
    assert.deepEqual(
      score([
        { passed: true, weight: 3 },
        { passed: false, weight: 1 },
      ]),
      { score: 0.75, passed: false, ungraded: 0 },
    )
    assert.deepEqual(score([{ passed: true }, { passed: null }]), { score: 1, passed: false, ungraded: 1 })
  })
})

describe("hosts", () => {
  test("recognizes skill files read through any install layout", () => {
    assert.deepEqual(skillsRead("sed -n '1,200p' .agents/skills/q-tdd/SKILL.md"), ["q-tdd"])
    assert.deepEqual(skillsRead("cat /tmp/w/.claude/skills/q-workflow/SKILL.md"), ["q-workflow"])
    assert.deepEqual(skillsRead("cat skills/q-tdd/README.md"), [])
  })

  test("normalizes a Claude Code stream", () => {
    const host = HOSTS.claude
    const state = host.start()
    const records = [
      { type: "system", subtype: "init", session_id: "s1" },
      {
        type: "assistant",
        message: {
          model: "claude-test-1",
          content: [
            { type: "tool_use", name: "Skill", input: { skill: "q:q-code-quality" } },
            { type: "tool_use", name: "Bash", input: { command: "git diff" } },
            { type: "tool_use", name: "Read", input: { file_path: "/w/.claude/skills/q-tdd/SKILL.md" } },
          ],
        },
      },
      { type: "assistant", parent_tool_use_id: "t1", message: { model: "claude-sub", content: [{ type: "text", text: "sub" }] } },
      { type: "assistant", message: { model: "claude-test-1", content: [{ type: "text", text: "done" }] } },
      {
        type: "result",
        result: "done",
        num_turns: 3,
        total_cost_usd: 0.5,
        modelUsage: {
          "claude-test-1": { inputTokens: 10, cacheReadInputTokens: 100, outputTokens: 20, thinkingTokens: 5 },
          "claude-sub": { inputTokens: 1, outputTokens: 2 },
        },
      },
    ]
    const events = records.flatMap((record) => host.line(state, record))
    const result = host.finish(state)
    assert.deepEqual(
      events.filter((event) => event.kind === "skill").map((event) => event.name),
      ["q-code-quality", "q-tdd"],
    )
    assert.equal(result.final, "done")
    assert.deepEqual(result.models, ["claude-test-1"])
    assert.equal(result.usage.input, 111, "input includes cache reads, as on Codex")
    assert.equal(result.usage.cachedInput, 100)
    assert.equal(result.usage.reasoning, 5)
    assert.equal(result.usage.costUsd, 0.5)
  })

  test("normalizes a Codex stream", () => {
    const host = HOSTS.codex
    const state = host.start()
    const records = [
      { type: "thread.started", thread_id: "t1" },
      {
        type: "item.completed",
        item: { type: "command_execution", command: "cat /home/u/.agents/skills/q-roadmap/SKILL.md", exit_code: 1 },
      },
      {
        type: "item.completed",
        item: { type: "command_execution", command: "/bin/zsh -lc 'cat .agents/skills/q-roadmap/SKILL.md'", exit_code: 0 },
      },
      { type: "item.completed", item: { type: "file_change", changes: [{ path: "a.js" }] } },
      { type: "item.completed", item: { type: "agent_message", text: "answer" } },
      { type: "turn.completed", usage: { input_tokens: 50, cached_input_tokens: 40, output_tokens: 9, reasoning_output_tokens: 4 } },
    ]
    const events = records.flatMap((record) => host.line(state, record))
    const result = host.finish(state)
    assert.deepEqual(
      events.map((event) => event.kind),
      ["command", "command", "skill", "write", "message"],
      "a failed read of a guessed skill path loads nothing",
    )
    assert.equal(result.final, "answer")
    assert.equal(result.sessionId, "t1")
    assert.deepEqual(result.usage, { input: 50, cachedInput: 40, cacheWrite: 0, output: 9, reasoning: 4, costUsd: null })
  })

  test("pins effort for both hosts and keeps inherited session variables out", () => {
    const claude = HOSTS.claude.command({ prompt: "p", model: "m", effort: "low" })
    assert.equal(claude.env.CLAUDE_CODE_EFFORT_LEVEL, "low")
    assert.ok(claude.args.includes("--effort"))
    const codex = HOSTS.codex.command({ prompt: "p", model: "m", effort: "high", cwd: "/w" })
    assert.ok(codex.args.includes('model_reasoning_effort="high"'))
    const environment = baseEnvironment({ HOME: "/h", PATH: "/p", CLAUDE_EFFORT: "max", CLAUDECODE: "1", OTEL_X: "y" })
    assert.deepEqual(environment, { HOME: "/h", PATH: "/p" })
  })
})

describe("eval.mjs", () => {
  test("plans a suite without running it", () => {
    const suiteDir = mkdtempSync(join(tmpdir(), "q-eval-suite-"))
    try {
      writeFileSync(
        join(suiteDir, "suite.json"),
        JSON.stringify({
          arms: {
            a: { host: "claude", model: "m", effort: "low" },
            b: { host: "codex", model: "n", effort: "high" },
          },
          judges: { claude: { host: "codex", model: "n", effort: "low" }, codex: { host: "claude", model: "m", effort: "low" } },
          reps: 2,
        }),
      )
      writeFileSync(
        join(suiteDir, "cases.json"),
        JSON.stringify([{ id: "one", prompt: "hi", graders: [{ type: "final", name: "g", pattern: "x" }] }]),
      )
      mkdirSync(join(suiteDir, "cases", "two"), { recursive: true })
      writeFileSync(
        join(suiteDir, "cases", "two", "case.json"),
        JSON.stringify({ prompt: "hi", graders: [{ type: "judge", name: "j", claim: "c" }] }),
      )
      const result = spawnSync("node", [join(ROOT, "scripts", "eval.mjs"), "run", suiteDir, "--dry-run"], {
        encoding: "utf8",
      })
      assert.equal(result.status, 0, result.stderr)
      assert.match(result.stdout, /2 cases x 2 arms \(a, b\) x 2 reps = 8 trials, each judged/)
    } finally {
      rmSync(suiteDir, { recursive: true, force: true })
    }
  })

  test("selects judged trials of a finished run for re-judging", () => {
    const suiteDir = mkdtempSync(join(tmpdir(), "q-eval-suite-"))
    const runDir = mkdtempSync(join(tmpdir(), "q-eval-run-"))
    try {
      const arms = { a: { host: "claude", model: "m", effort: "low" } }
      const judges = { claude: { host: "codex", model: "n", effort: "low" } }
      writeFileSync(join(suiteDir, "suite.json"), JSON.stringify({ arms, judges }))
      writeFileSync(
        join(suiteDir, "cases.json"),
        JSON.stringify([
          { id: "judged", prompt: "hi", graders: [{ type: "judge", name: "j", claim: "c" }] },
          { id: "plain", prompt: "hi", graders: [{ type: "final", name: "f", pattern: "x" }] },
        ]),
      )
      writeFileSync(join(runDir, "run.json"), JSON.stringify({ suiteDir, arms, judges }))
      const row = (name, graders) => JSON.stringify({ case: name, arm: "a", trial: `${name}__a__r1`, graders })
      writeFileSync(
        join(runDir, "results.jsonl"),
        `${row("judged", [{ name: "j", type: "judge", passed: true }])}\n${row("plain", [{ name: "f", type: "final", passed: true }])}\n`,
      )
      const result = spawnSync("node", [join(ROOT, "scripts", "eval.mjs"), "regrade", runDir, "--dry-run"], {
        encoding: "utf8",
      })
      assert.equal(result.status, 0, result.stderr)
      assert.match(result.stdout, /regrading 1 of 1 judged trials/)
    } finally {
      rmSync(suiteDir, { recursive: true, force: true })
      rmSync(runDir, { recursive: true, force: true })
    }
  })

  test("extends a fixed split with new cases only", () => {
    const suiteDir = mkdtempSync(join(tmpdir(), "q-eval-suite-"))
    try {
      writeFileSync(join(suiteDir, "suite.json"), JSON.stringify({ arms: {} }))
      const entry = (id, kind) => ({ id, tags: ["defect", kind], prompt: "p", graders: [{ type: "final", name: "g", pattern: "x" }] })
      writeFileSync(
        join(suiteDir, "cases.json"),
        JSON.stringify([entry("old-a", "docs"), entry("old-b", "docs"), ...["n1", "n2", "n3", "n4", "n5"].map((id) => entry(id, "docs"))]),
      )
      writeFileSync(join(suiteDir, "split.json"), JSON.stringify({ seed: 1, train: ["old-a"], test: ["old-b"] }))
      const result = spawnSync(
        "node",
        [join(ROOT, "scripts", "eval.mjs"), "split", suiteDir, "--extend", "--strata", "2"],
        { encoding: "utf8" },
      )
      assert.equal(result.status, 0, result.stderr)
      const extended = JSON.parse(readFileSync(join(suiteDir, "split.json"), "utf8"))
      assert.ok(extended.train.includes("old-a") && extended.test.includes("old-b"), "earlier assignments stay")
      assert.equal(extended.train.length + extended.test.length, 7)
      assert.equal(extended.extensions.length, 1)
      assert.equal(extended.extensions[0].test.length, 2)
    } finally {
      rmSync(suiteDir, { recursive: true, force: true })
    }
  })

  test("refuses a judge from the family under test", () => {
    const suiteDir = mkdtempSync(join(tmpdir(), "q-eval-suite-"))
    try {
      writeFileSync(
        join(suiteDir, "suite.json"),
        JSON.stringify({
          arms: { a: { host: "claude", model: "m", effort: "low" } },
          judges: { claude: { host: "claude", model: "m", effort: "low" } },
        }),
      )
      writeFileSync(
        join(suiteDir, "cases.json"),
        JSON.stringify([{ id: "one", prompt: "hi", graders: [{ type: "judge", name: "j", claim: "c" }] }]),
      )
      const result = spawnSync("node", [join(ROOT, "scripts", "eval.mjs"), "run", suiteDir, "--dry-run"], {
        encoding: "utf8",
      })
      assert.equal(result.status, 1)
      assert.match(result.stderr, /another model family/)
    } finally {
      rmSync(suiteDir, { recursive: true, force: true })
    }
  })
})
