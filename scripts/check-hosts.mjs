#!/usr/bin/env node
// Installs this checkout into a throwaway repository with the skills CLI, resolves every relative
// link through the installed layout, then asks each installed host what it actually loads: Claude
// Code (`claude plugin validate`, and a plugin install into a throwaway config), Codex (`codex
// debug prompt-input`), and pi (its own skill loader). Every host must load every skill, and the
// model must see exactly the skills without `disable-model-invocation: true`.
// Needs network for npx. Skips a host that is not installed; for pi, set PI_PACKAGE_DIR to an
// installed @earendil-works/pi-coding-agent package directory, or install it globally.
// Usage: node scripts/check-hosts.mjs [--live]
//   --live  also invoke q-workflow's read-only Check on each installed host CLI (spends model tokens)

import { spawnSync } from "node:child_process"
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SKILLS_CLI = "skills@1.7.0"
const LIVE = process.argv.includes("--live")
const INFERENCE_LINE = /q config: none; inferred tracker=local integration=local parent=main/
const failures = []
const skipped = []

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options })
}

function has(command) {
  return run("sh", ["-c", `command -v ${command}`]).status === 0
}

function check(host, condition, message) {
  if (!condition) {
    failures.push(`${host}: ${message}`)
  }
}

function sameSet(left, right) {
  return left.length === right.length && left.every((item) => right.includes(item))
}

const skillNames = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
const modelVisible = skillNames.filter((name) => {
  const text = readFileSync(join(ROOT, "skills", name, "SKILL.md"), "utf8")
  return !/^disable-model-invocation:\s*true\s*$/m.test(text)
})

const consumer = mkdtempSync(join(tmpdir(), "q-hosts-"))
run("git", ["init", "-q", "-b", "main"], { cwd: consumer })
writeFileSync(join(consumer, "README.md"), "# host check\n")
run("git", ["add", "."], { cwd: consumer })
run(
  "git",
  ["-c", "user.name=check", "-c", "user.email=check@example.com", "-c", "commit.gpgsign=false", "commit", "-qm", "init"],
  { cwd: consumer },
)

const install = run("npx", ["-y", SKILLS_CLI, "add", ROOT, "-a", "claude-code", "codex", "pi", "-y"], {
  cwd: consumer,
  env: { ...process.env, DISABLE_TELEMETRY: "1" },
})
check("skills CLI", install.status === 0, `install failed: ${install.stderr || install.stdout}`)

const installed = existsSync(join(consumer, ".agents", "skills"))
  ? readdirSync(join(consumer, ".agents", "skills")).sort()
  : []
check("skills CLI", sameSet(installed, skillNames), `installed ${installed.length} of ${skillNames.length}`)
for (const name of skillNames) {
  const link = join(consumer, ".claude", "skills", name)
  check("skills CLI", existsSync(link) && lstatSync(link).isSymbolicLink(), `.claude/skills/${name} missing`)
}

/** Every relative Markdown link in an installed skill, resolved the way a host reads it. */
function brokenInstalledLinks(skillsDirectory) {
  const broken = []

  function visit(directory) {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry)
      if (statSync(path).isDirectory()) {
        visit(path)
        continue
      }

      if (!path.endsWith(".md")) {
        continue
      }

      const text = readFileSync(path, "utf8")
        .replace(/^\s*(```|~~~)[\s\S]*?^\s*\1\s*$/gm, "")
        .replace(/`[^`\n]*`/g, "")
      for (const match of text.matchAll(/\]\(([^)\s#]+)(?:#[^)\s]*)?\)/g)) {
        if (!/^(?:https?:|mailto:)/.test(match[1]) && !existsSync(resolve(dirname(path), match[1]))) {
          broken.push(`${path.slice(consumer.length + 1)} -> ${match[1]}`)
        }
      }
    }
  }

  visit(skillsDirectory)
  return broken
}

for (const directory of [join(consumer, ".agents", "skills"), join(consumer, ".claude", "skills")]) {
  if (existsSync(directory)) {
    const broken = brokenInstalledLinks(directory)
    check("installed layout", broken.length === 0, `broken links:\n  ${broken.join("\n  ")}`)
  }
}

// Run each shipped script from the installed layout (Claude Code reads through the symlinks).
const threatModel = run("node", [join(".agents", "skills", "q-threat-model", "scripts", "validate-threat-model.mjs")], {
  cwd: consumer,
})
check(
  "installed scripts",
  threatModel.status === 1 && /threat model validation/.test(threatModel.stderr),
  `validate-threat-model did not report the missing document: ${threatModel.status} ${threatModel.stderr}`,
)
const doctor = run("bash", [join(".claude", "skills", "q-computer-use", "scripts", "doctor.sh"), "web"], { cwd: consumer })
check(
  "installed scripts",
  [0, 1].includes(doctor.status) && /web:/.test(doctor.stdout),
  `doctor.sh web failed to run: ${doctor.status} ${doctor.stderr}`,
)
const simTap = run("bash", [join(".agents", "skills", "q-computer-use", "scripts", "sim-tap.sh")], { cwd: consumer })
check("installed scripts", [1, 2].includes(simTap.status), `sim-tap.sh usage check exited ${simTap.status}`)

if (has("claude")) {
  for (const target of [ROOT, join(ROOT, "skills")]) {
    const result = run("claude", ["plugin", "validate", target])
    check("Claude Code", result.status === 0, `plugin validate ${target} failed:\n${result.stdout}${result.stderr}`)
  }

  // Install the plugin from this checkout into a throwaway config so user settings stay untouched.
  const config = mkdtempSync(join(tmpdir(), "q-hosts-claude-"))
  const env = { ...process.env, CLAUDE_CONFIG_DIR: config }
  run("claude", ["plugin", "marketplace", "add", ROOT], { env })
  const install = run("claude", ["plugin", "install", "q@q-skills"], { env })
  check("Claude Code", install.status === 0, `plugin install failed: ${install.stdout}${install.stderr}`)
  const details = run("claude", ["plugin", "details", "q"], { env }).stdout
  const inventory = /Skills \((\d+)\)\s+(.+)/.exec(details)
  const pluginSkills = inventory ? inventory[2].split(",").map((name) => name.trim()).sort() : []
  check("Claude Code", sameSet(pluginSkills, skillNames), `plugin loads [${pluginSkills}]`)
  rmSync(config, { recursive: true, force: true })

  if (LIVE) {
    const tools = "Read,Glob,Grep,Bash(git *),Bash(gh auth status),Bash(ls *),Bash(cat *)"
    const live = run("claude", ["-p", "/q-workflow check", "--allowedTools", tools, "--max-turns", "25"], {
      cwd: consumer,
    })
    check("Claude Code", INFERENCE_LINE.test(live.stdout), `live q-workflow check:\n${live.stdout}${live.stderr}`)
  }
} else {
  skipped.push("Claude Code (claude not on PATH)")
}

if (has("codex")) {
  const result = run("codex", ["debug", "prompt-input", "hello"], { cwd: consumer })
  check("Codex", result.status === 0, `prompt-input failed: ${result.stderr}`)
  const listed = [...new Set(result.stdout.match(/- (q-[a-z-]+): /g) ?? [])]
    .map((entry) => entry.slice(2, -2))
    .sort()
  check("Codex", sameSet(listed, modelVisible), `model sees [${listed}], expected [${modelVisible}]`)

  if (LIVE) {
    const live = run("codex", ["exec", "--sandbox", "read-only", "--skip-git-repo-check", "$q-workflow check"], {
      cwd: consumer,
    })
    check("Codex", INFERENCE_LINE.test(live.stdout + live.stderr), `live q-workflow check:\n${live.stdout}${live.stderr}`)
  }
} else {
  skipped.push("Codex (codex not on PATH)")
}

const globalRoot = run("npm", ["root", "-g"]).stdout.trim()
const piPackage =
  process.env.PI_PACKAGE_DIR ?? join(globalRoot, "@earendil-works", "pi-coding-agent")
const piLoader = join(piPackage, "dist", "core", "skills.js")
if (existsSync(piLoader)) {
  const { loadSkillsFromDir, formatSkillsForPrompt } = await import(pathToFileURL(piLoader).href)
  const { skills, diagnostics } = loadSkillsFromDir({
    dir: join(consumer, ".agents", "skills"),
    source: "project",
  })
  const loaded = skills.map((skill) => skill.name).sort()
  check("pi", sameSet(loaded, skillNames), `loaded [${loaded}]`)
  check("pi", diagnostics.length === 0, `diagnostics: ${JSON.stringify(diagnostics)}`)
  const visible = [...formatSkillsForPrompt(skills).matchAll(/<name>([^<]+)<\/name>/g)]
    .map((match) => match[1])
    .sort()
  check("pi", sameSet(visible, modelVisible), `model sees [${visible}], expected [${modelVisible}]`)
} else {
  skipped.push("pi (set PI_PACKAGE_DIR or install @earendil-works/pi-coding-agent globally)")
}

rmSync(consumer, { recursive: true, force: true })

for (const host of skipped) {
  console.log(`check-hosts: skipped ${host}`)
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`check-hosts: ${failure}`)
  }

  process.exit(1)
}

console.log(`check-hosts: ${skillNames.length} skills load on every checked host`)
