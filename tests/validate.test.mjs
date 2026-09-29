import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { describe, test } from "node:test"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/** Copies everything validate.mjs reads into a throwaway directory. */
function copySuite() {
  const directory = mkdtempSync(join(tmpdir(), "q-validate-"))
  for (const path of ["skills", "scripts", ".claude-plugin", "README.md", "CHANGELOG.md"]) {
    cpSync(join(ROOT, path), join(directory, path), { recursive: true })
  }

  return directory
}

function validate(directory) {
  return spawnSync("node", [join(directory, "scripts", "validate.mjs")], { encoding: "utf8" })
}

function edit(directory, path, change) {
  const file = join(directory, path)
  writeFileSync(file, change(readFileSync(file, "utf8")))
}

function assertRejects(change, expected) {
  const directory = copySuite()
  try {
    change(directory)
    const result = validate(directory)
    assert.equal(result.status, 1, result.stdout)
    assert.match(result.stderr, expected)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe("validate", () => {
  test("passes the suite as committed", () => {
    const directory = copySuite()
    try {
      const result = validate(directory)
      assert.equal(result.status, 0, result.stderr)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test("rejects a duplicate frontmatter key", () => {
    assertRejects(
      (directory) => edit(directory, "skills/q-tdd/SKILL.md", (text) => text.replace("license: MIT\n", "license: MIT\nlicense: MIT\n")),
      /duplicate frontmatter key: license/,
    )
  })

  test("rejects an unquoted description", () => {
    assertRejects(
      (directory) =>
        edit(directory, "skills/q-tdd/SKILL.md", (text) =>
          text.replace(/^description: "(.*)"$/m, "description: $1"),
        ),
      /description must be a double-quoted string/,
    )
  })

  test("rejects an invocation policy nested outside policy", () => {
    assertRejects(
      (directory) =>
        edit(directory, "skills/q-spec/agents/openai.yaml", (text) =>
          text.replace("\npolicy:\n  allow_implicit_invocation: false\n", "\n  allow_implicit_invocation: false\n"),
        ),
      /explicit-only skill must set policy\.allow_implicit_invocation: false/,
    )
  })

  test("rejects a link that escapes skills/", () => {
    assertRejects(
      (directory) =>
        edit(directory, "skills/q-tdd/SKILL.md", (text) => `${text}\nSee [agents](../../AGENTS.md).\n`),
      /link escapes skills\//,
    )
  })

  test("rejects a missing anchor", () => {
    assertRejects(
      (directory) =>
        edit(directory, "skills/q-tdd/SKILL.md", (text) =>
          text.replace("code-style.md#tests", "code-style.md#no-such-section"),
        ),
      /missing anchor #no-such-section/,
    )
  })

  test("rejects a standalone skill that depends on a lifecycle skill", () => {
    assertRejects(
      (directory) =>
        edit(directory, "skills/q-tdd/SKILL.md", (text) => `${text}\nThen [plan](../q-plan/SKILL.md).\n`),
      /standalone skill q-tdd depends on q-plan/,
    )
  })

  test("rejects project leaks and unknown skill names", () => {
    assertRejects(
      (directory) =>
        edit(directory, "skills/q-tdd/SKILL.md", (text) => `${text}\nRun it like hypework does, then q-deploy.\n`),
      /project name from the source project[\s\S]*unknown q identifier "q-deploy"/,
    )
  })

  test("rejects a documented default that disagrees with the schema", () => {
    assertRejects(
      (directory) =>
        edit(directory, "skills/q-workflow/references/config.md", (text) =>
          text.replace("| `conventions.baseline` | `true` |", "| `conventions.baseline` | `false` |"),
        ),
      /default for conventions\.baseline disagrees with the schema/,
    )
  })

  test("rejects a pinned plugin version", () => {
    assertRejects(
      (directory) =>
        edit(directory, ".claude-plugin/plugin.json", (text) => text.replace('"name": "q",', '"name": "q",\n  "version": "1.0.0",')),
      /omit version/,
    )
  })

  test("rejects a skill missing from the README catalog", () => {
    assertRejects(
      (directory) => edit(directory, "README.md", (text) => text.replaceAll("`q-tdd`", "tdd")),
      /catalog does not list `q-tdd`/,
    )
  })
})
