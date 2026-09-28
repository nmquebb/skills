import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import process from "node:process"
import { after, before, describe, test } from "node:test"
import { fileURLToPath } from "node:url"

const VALIDATOR = fileURLToPath(
  new URL("../skills/q-threat-model/scripts/validate-threat-model.mjs", import.meta.url),
)
const COMMITTED_AT = "2020-01-15T12:00:00Z"
const REVIEWED_AT = "2020-01-16T09:30:00Z"
const PREFIX = "threat model validation: "

// Inherited GIT_* variables (for example GIT_DIR inside a hook) would point Git at another
// repository, so every Git process here gets an environment without them.
const CLEAN_ENVIRONMENT = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")),
)

let workspace
let repository
let baseline
let caseNumber = 0

function numberedLines(count) {
  return Array.from({ length: count }, (_, index) => `// line ${index + 1}`).join("\n") + "\n"
}

function writeRepositoryFile(path, content) {
  const absolutePath = join(repository, path)
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, content)
}

function git(args) {
  const commitDate = `${Date.parse(COMMITTED_AT) / 1_000} +0000`
  return execFileSync(
    "git",
    ["-c", "commit.gpgsign=false", "-c", `core.hooksPath=${join(workspace, "no-hooks")}`, ...args],
    {
      cwd: repository,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...CLEAN_ENVIRONMENT,
        GIT_AUTHOR_NAME: "q test",
        GIT_AUTHOR_EMAIL: "q-test@example.invalid",
        GIT_AUTHOR_DATE: commitDate,
        GIT_COMMITTER_NAME: "q test",
        GIT_COMMITTER_EMAIL: "q-test@example.invalid",
        GIT_COMMITTER_DATE: commitDate,
      },
    },
  ).trim()
}

function validThreatModel() {
  return [
    "# Example Threat Model",
    "",
    "## Status",
    "",
    `- Baseline commit: \`${baseline}\``,
    `- Reviewed at: ${REVIEWED_AT}`,
    "- Scope: the whole repository at this commit",
    "- Out of scope: hosting, DNS, and TLS termination, which no committed file describes",
    "- Open assumptions: 2",
    "",
    "## Executive summary",
    "",
    "One HTTP service in `src/server.js` authenticates users with a session cookie issued by",
    "`src/auth/session.js:4`. Login is rate limited; sessions are not rotated at login (TM-002).",
    "",
    "## Scope and assumptions",
    "",
    "Production runtime: `src/`. CI and tooling: `.github/workflows/ci.yml` and `package.json:2`.",
    "Tests and fixtures: none. Routes such as `POST /login` and `/login`, identifiers such as",
    "`APP_SECRET`, `origin/main`, `@example/client`, `image/png`, `localhost:3000`, `src/**/*.js`,",
    "and `https://example.com/security` are not evidence paths.",
    "",
    "## System model",
    "",
    "### Components",
    "",
    "- HTTP server: `./src/server.js`.",
    "- Session issuance: `src/auth/`.",
    "",
    "### Trust boundaries",
    "",
    "| Boundary | Data crossing | Channel | Guarantees | Validation | Evidence |",
    "| -------- | ------------- | ------- | ---------- | ---------- | -------- |",
    "| Internet → server | Credentials | HTTPS | Rate limit | Body schema | `src/server.js:12` |",
    "",
    "### Diagram",
    "",
    "```mermaid",
    "flowchart LR",
    '  subgraph internet["Internet"]',
    '    user["User"]',
    "  end",
    '  subgraph runtime["Runtime"]',
    '    server["Server"]',
    "  end",
    "  user -->|login| server",
    "```",
    "",
    "## Assets",
    "",
    "| Asset | Why it matters | Objective | Evidence |",
    "| ----- | -------------- | --------- | -------- |",
    "| Session cookie | Grants account access | C, I | `src/auth/session.js:4` |",
    "",
    "## Attacker model",
    "",
    "### Capabilities",
    "",
    "- Sends arbitrary HTTP requests from the internet.",
    "",
    "### Non-capabilities",
    "",
    "- No access to the host, the database, or CI secrets.",
    "",
    "## Entry points",
    "",
    "| Surface | How reached | Boundary | Notes | Evidence |",
    "| ------- | ----------- | -------- | ----- | -------- |",
    "| `POST /login` | Public HTTP | Internet → server | Rate limited | `src/server.js:12` |",
    "",
    "## Abuse paths",
    "",
    "1. Account takeover (TM-001, TM-002): the attacker guesses a password or fixes a session,",
    "   then reuses the session cookie.",
    "",
    "## Threats",
    "",
    "| ID | Title | Boundary | Priority | Status |",
    "| -- | ----- | -------- | -------- | ------ |",
    "| TM-002 | Session fixation at login | Internet → server | high | active |",
    "| TM-001 | Password guessing | Internet → server | medium | mitigated |",
    "",
    "### TM-001 — Password guessing",
    "",
    "- Status: mitigated",
    "- Goal: take over an account.",
    "- Prerequisites: a known username.",
    "- Action: repeated login attempts.",
    "- Impacted assets: session cookie.",
    "- Existing controls: per-source rate limit in `src/server.js:12`.",
    "- Gap: none known.",
    "- Recommended mitigation: keep the rate limit.",
    "- Detection: failed-login counter.",
    "- Likelihood: low — the rate limit bounds attempts.",
    "- Impact: high — account takeover.",
    "- Priority: medium",
    "",
    "### TM-002 — Session fixation at login",
    "",
    "- Status: active",
    "- Goal: ride a victim's session.",
    "- Prerequisites: the victim logs in with an attacker-chosen session identifier.",
    "- Action: plant a session cookie, then wait for login.",
    "- Impacted assets: session cookie.",
    "- Existing controls: none.",
    "- Gap: `src/auth/session.js:4` keeps the pre-login session identifier.",
    "- Recommended mitigation: rotate the session at login.",
    "- Detection: none.",
    "- Likelihood: medium — needs a cookie-injection foothold.",
    "- Impact: high — account takeover.",
    "- Priority: high",
    "",
    "## Priority calibration",
    "",
    "- **Critical**: unauthenticated account takeover at scale.",
    "- **High**: account takeover with one precondition, such as TM-002.",
    "- **Medium**: bounded takeover attempts, such as TM-001.",
    "- **Low**: disclosure without direct impact.",
    "",
    "## Focus paths for review",
    "",
    "| Path | Why it matters | Threats |",
    "| ---- | -------------- | ------- |",
    "| `src/server.js` | Rate limit and login route | TM-001 |",
    "| `src/auth/session.js` | Session issuance and rotation | TM-002 |",
    "",
    "## Open questions",
    "",
    "1. Does production terminate TLS before the server?",
    "2. Does an edge rate limiter front the login route?",
    "",
  ].join("\n")
}

function replaceOnce(text, search, replacement) {
  const index = text.indexOf(search)
  assert.notEqual(index, -1, `fixture lacks ${JSON.stringify(search)}`)
  assert.equal(text.indexOf(search, index + 1), -1, `fixture repeats ${JSON.stringify(search)}`)
  return text.slice(0, index) + replacement + text.slice(index + search.length)
}

function swapLines(text, first, second) {
  const lines = text.split("\n")
  const firstIndex = lines.indexOf(first)
  const secondIndex = lines.indexOf(second)
  assert.notEqual(firstIndex, -1, `fixture lacks the line ${JSON.stringify(first)}`)
  assert.notEqual(secondIndex, -1, `fixture lacks the line ${JSON.stringify(second)}`)
  lines[firstIndex] = second
  lines[secondIndex] = first
  return lines.join("\n")
}

function runValidator(args, cwd) {
  const result = spawnSync(process.execPath, [VALIDATOR, ...args], {
    cwd,
    encoding: "utf8",
    env: CLEAN_ENVIRONMENT,
  })
  return {
    status: result.status,
    stdout: result.stdout,
    failures: result.stderr.split("\n").filter((line) => line !== ""),
  }
}

// Writes the document into the fixture repository and validates it from outside the repository,
// so both --root and the root-relative path argument are exercised.
function validateDocument(document) {
  caseNumber += 1
  const path = `docs/case-${caseNumber}.md`
  writeRepositoryFile(path, document)
  return runValidator([path, "--root", repository], workspace)
}

function assertFailures(document, expected) {
  const result = validateDocument(document)
  assert.deepEqual(
    result.failures,
    expected.map((failure) => PREFIX + failure),
  )
  assert.equal(result.status, 1)
  assert.equal(result.stdout, "")
}

describe("validate-threat-model", () => {
  before(() => {
    workspace = mkdtempSync(join(tmpdir(), "q-threat-model-"))
    repository = join(workspace, "repository")
    writeRepositoryFile("src/server.js", numberedLines(20))
    writeRepositoryFile("src/auth/session.js", numberedLines(10))
    writeRepositoryFile("package.json", '{\n  "name": "example",\n  "private": true\n}\n')
    writeRepositoryFile(".github/workflows/ci.yml", "on: push\njobs: {}\n")
    git(["init", "--quiet"])
    git(["add", "--all"])
    git(["commit", "--quiet", "--no-verify", "--message", "Initial commit"])
    baseline = git(["rev-parse", "--short", "HEAD"])
  })

  after(() => {
    rmSync(workspace, { recursive: true, force: true })
  })

  test("passes a valid threat model", () => {
    const result = validateDocument(validThreatModel())
    assert.deepEqual(result.failures, [])
    assert.equal(result.stdout, "threat model validation: passed\n")
    assert.equal(result.status, 0)
  })

  test("finds the repository root and default path from a subdirectory", () => {
    writeRepositoryFile("docs/threat-model.md", validThreatModel())
    const result = runValidator([], join(repository, "src"))
    assert.deepEqual(result.failures, [])
    assert.equal(result.stdout, "threat model validation: passed\n")
    assert.equal(result.status, 0)
  })

  test("rejects level-two headings out of order", () => {
    assertFailures(swapLines(validThreatModel(), "## Assets", "## Attacker model"), [
      'expected heading 5 to be "## Assets", found "## Attacker model"',
      'expected heading 6 to be "## Attacker model", found "## Assets"',
    ])
  })

  test("rejects a threat index not ordered by priority, then ID", () => {
    const document = swapLines(
      validThreatModel(),
      "| TM-002 | Session fixation at login | Internet → server | high | active |",
      "| TM-001 | Password guessing | Internet → server | medium | mitigated |",
    )
    assertFailures(document, ["threat index is not ordered by priority, then ID"])
  })

  test("rejects a threat missing a required field", () => {
    const document = replaceOnce(validThreatModel(), "- Detection: failed-login counter.\n", "")
    assertFailures(document, ["TM-001 is missing the Detection field"])
  })

  test("rejects an evidence path that does not exist", () => {
    const document = replaceOnce(validThreatModel(), "`src/auth/`", "`src/auth/tokens.js`")
    assertFailures(document, ["evidence path does not exist: src/auth/tokens.js"])
  })

  test("rejects an evidence path under a missing top-level directory", () => {
    const document = replaceOnce(validThreatModel(), "`src/auth/`", "`nonexistent/module.js:10`")
    assertFailures(document, ["evidence path does not exist: nonexistent/module.js"])
  })

  test("rejects a directory anchor under a missing top-level directory", () => {
    const document = replaceOnce(validThreatModel(), "`src/auth/`", "`nonexistent/component/`")
    assertFailures(document, ["evidence path does not exist: nonexistent/component/"])
  })

  test("ignores prose spans that only resemble paths", () => {
    const document = replaceOnce(
      validThreatModel(),
      "`src/auth/`",
      "`src/auth/` over `HTTP/1.1` with `application/json`",
    )
    const result = validateDocument(document)
    assert.deepEqual(result.failures, [])
    assert.equal(result.status, 0)
  })

  test("rejects an evidence line outside its file", () => {
    const document = replaceOnce(validThreatModel(), "`package.json:2`", "`package.json:40`")
    assertFailures(document, ["evidence line is outside package.json: 40"])
  })

  test("rejects a baseline that does not resolve to a commit", () => {
    const document = replaceOnce(
      validThreatModel(),
      `- Baseline commit: \`${baseline}\``,
      "- Baseline commit: `deadbeefdeadbeefdeadbeefdeadbeefdeadbeef`",
    )
    assertFailures(document, ["baseline commit does not resolve to a commit"])
  })

  test("rejects an open-assumption count that differs from the open questions", () => {
    const document = replaceOnce(
      validThreatModel(),
      "- Open assumptions: 2",
      "- Open assumptions: 3",
    )
    assertFailures(document, ["open-assumption count does not match the 2 numbered open questions"])
  })

  test("rejects a reviewed timestamp before the baseline commit", () => {
    const document = replaceOnce(
      validThreatModel(),
      `- Reviewed at: ${REVIEWED_AT}`,
      "- Reviewed at: 2020-01-14T09:30:00Z",
    )
    assertFailures(document, ["reviewed timestamp predates the baseline commit"])
  })

  test("rejects a reviewed timestamp in the future", () => {
    const document = replaceOnce(
      validThreatModel(),
      `- Reviewed at: ${REVIEWED_AT}`,
      "- Reviewed at: 2999-01-01T00:00:00Z",
    )
    assertFailures(document, ["reviewed timestamp is in the future"])
  })
})
