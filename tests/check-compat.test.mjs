import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { describe, test } from "node:test"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SCHEMA = "skills/q-workflow/references/config.schema.json"

// Hermetic git: no global or system configuration (signing, hooks, identity) leaks into tests.
const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "q test",
  GIT_AUTHOR_EMAIL: "q-test@example.invalid",
  GIT_COMMITTER_NAME: "q test",
  GIT_COMMITTER_EMAIL: "q-test@example.invalid",
}

function gitIn(directory) {
  return (...args) => spawnSync("git", args, { cwd: directory, encoding: "utf8", env: GIT_ENV })
}

/** Copies the suite into a throwaway repository whose `v1` branch is the unchanged suite. */
function createChannelRepository() {
  const directory = mkdtempSync(join(tmpdir(), "q-compat-"))
  cpSync(join(ROOT, "skills"), join(directory, "skills"), { recursive: true })
  cpSync(join(ROOT, "scripts", "check-compat.mjs"), join(directory, "scripts", "check-compat.mjs"))
  const git = gitIn(directory)
  git("init", "-q", "-b", "main")
  git("add", ".")
  git("commit", "-qm", "base")
  git("branch", "v1")
  return directory
}

function checkCompat(directory, ref = "v1") {
  return spawnSync("node", [join(directory, "scripts", "check-compat.mjs"), ref], {
    cwd: directory,
    encoding: "utf8",
    env: GIT_ENV,
  })
}

function edit(directory, path, change) {
  const file = join(directory, path)
  writeFileSync(file, change(readFileSync(file, "utf8")))
}

function assertBreaks(directory, expected) {
  const result = checkCompat(directory)
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stderr, expected)
}

describe("check-compat", () => {
  test("passes an unchanged tree and a missing channel", () => {
    const directory = createChannelRepository()
    try {
      assert.equal(checkCompat(directory).status, 0)
      const missing = checkCompat(directory, "v9")
      assert.equal(missing.status, 0)
      assert.match(missing.stdout, /does not exist/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("passes additive changes", () => {
    const directory = createChannelRepository()
    try {
      edit(directory, SCHEMA, (text) => {
        const schema = JSON.parse(text)
        schema.properties.git.properties.newOptionalKey = { type: "string" }
        schema.properties.roadmap.properties.backend.enum.push("linear")
        return JSON.stringify(schema, null, 2)
      })
      edit(directory, "skills/q-spec/references/artifact-format.md", (text) =>
        text.replace("## Problem\n", "## Problem\n\n## Context\n"),
      )
      assert.equal(checkCompat(directory).status, 0)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("rejects a removed skill", () => {
    const directory = createChannelRepository()
    try {
      rmSync(join(directory, "skills", "q-tdd"), { recursive: true })
      assertBreaks(directory, /skill q-tdd was removed/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("rejects a changed invocation policy", () => {
    const directory = createChannelRepository()
    try {
      edit(directory, "skills/q-spec/SKILL.md", (text) =>
        text.replace("disable-model-invocation: true\n", ""),
      )
      assertBreaks(directory, /q-spec changed its invocation policy/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("rejects a removed configuration key, enumeration value, and version change", () => {
    const directory = createChannelRepository()
    try {
      edit(directory, SCHEMA, (text) => {
        const schema = JSON.parse(text)
        delete schema.properties.git.properties.worktreeRoot
        schema.properties.tracker.properties.backend.enum = ["github", "local"]
        schema.properties.version.const = 2
        return JSON.stringify(schema, null, 2)
      })
      const result = checkCompat(directory)
      assert.equal(result.status, 1)
      assert.match(result.stderr, /git\.worktreeRoot was removed/)
      assert.match(result.stderr, /tracker\.backend no longer accepts "custom"/)
      assert.match(result.stderr, /version changed from 1 to 2/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("rejects a changed static default", () => {
    const directory = createChannelRepository()
    try {
      edit(directory, SCHEMA, (text) => {
        const schema = JSON.parse(text)
        schema.properties.git.properties.workspace.default = "branch"
        return JSON.stringify(schema, null, 2)
      })
      assertBreaks(directory, /git\.workspace default changed from "worktree"/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("requires a review for a guarded section, by trailer or flag", () => {
    const directory = createChannelRepository()
    const git = gitIn(directory)
    try {
      edit(directory, "skills/q-workflow/references/lifecycle.md", (text) =>
        text.replace("Ordinary work still requires a separate request to push or merge.", "Ordinary work still requires an explicit request to push or merge."),
      )
      assertBreaks(directory, /section "Authority" changed; needs review[\s\S]*Compat-Reviewed/)

      const flagged = spawnSync(
        "node",
        [join(directory, "scripts", "check-compat.mjs"), "v1", "--reviewed", "wording only"],
        { cwd: directory, encoding: "utf8", env: GIT_ENV },
      )
      assert.equal(flagged.status, 0, flagged.stderr)

      git("add", ".")
      git("commit", "-qm", "docs: reword authority\n\nCompat-Reviewed: wording only; no authority change")
      const committed = checkCompat(directory)
      assert.equal(committed.status, 0, committed.stderr)
      assert.match(committed.stdout, /reviewed as compatible \(Compat-Reviewed: wording only/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("never lets an older review trailer cover a later change", () => {
    const directory = createChannelRepository()
    const git = gitIn(directory)
    const lifecycle = "skills/q-workflow/references/lifecycle.md"
    try {
      edit(directory, lifecycle, (text) =>
        text.replace("Ordinary work still requires a separate request to push or merge.", "Ordinary work still requires an explicit request to push or merge."),
      )
      git("commit", "-qam", "docs: reword authority\n\nCompat-Reviewed: wording only")
      assert.equal(checkCompat(directory).status, 0)

      edit(directory, lifecycle, (text) =>
        text.replace("Ordinary work still requires an explicit request to push or merge.", "Ordinary work may push or merge without a request."),
      )
      git("commit", "-qam", "docs: loosen authority")
      assertBreaks(directory, /section "Authority" changed; needs review/)

      git("commit", "-q", "--allow-empty", "-m", "docs: review authority change\n\nCompat-Reviewed: checked the later change")
      assert.equal(checkCompat(directory).status, 0)

      edit(directory, lifecycle, (text) => text.replace("Ordinary work may push or merge without a request.", "Ordinary work may do anything."))
      assertBreaks(directory, /section "Authority" changed; needs review/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("ignores rewrapping a guarded section", () => {
    const directory = createChannelRepository()
    try {
      edit(directory, "skills/q-workflow/references/lifecycle.md", (text) =>
        text.replace("Ordinary work still requires a separate request to push or merge.", "Ordinary work still requires a separate request\nto push or merge."),
      )
      assert.equal(checkCompat(directory).status, 0)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("rejects a removed marker", () => {
    const directory = createChannelRepository()
    try {
      const pattern = /q-triage-proposal:v1/g
      for (const path of [
        "skills/q-workflow/references/backends/tracker-github.md",
        "skills/q-workflow/references/artifacts.md",
      ]) {
        edit(directory, path, (text) => text.replace(pattern, "q-triage-proposal:v2"))
      }

      assertBreaks(directory, /marker q-triage-proposal:v1 is no longer documented/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("rejects a removed artifact-format field", () => {
    const directory = createChannelRepository()
    try {
      edit(directory, "skills/q-plan/references/plan-format.md", (text) =>
        text.replace(/^- Delivery policy:.*\n/m, ""),
      )
      assertBreaks(directory, /plan-format\.md: format field "- Delivery policy:" was removed/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
