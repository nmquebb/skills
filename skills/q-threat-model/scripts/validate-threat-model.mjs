#!/usr/bin/env node
// Validates a threat model against the structural rules in ../references/threat-model-format.md.
//
// Usage: node <skill-dir>/scripts/validate-threat-model.mjs [path] [--root <dir>]
//   path     the threat model, relative to the repository root (default docs/threat-model.md)
//   --root   the repository root (default: `git rev-parse --show-toplevel` from the current
//            directory); evidence paths and the baseline commit resolve against it
//
// Prints one failure per line to stderr and exits 1, or prints "threat model validation: passed"
// and exits 0. Exits 2 on a usage error. Reads only; writes nothing. Node 20+, no dependencies.

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import { isAbsolute, relative, resolve } from "node:path"
import process from "node:process"
import { parseArgs } from "node:util"

const PREFIX = "threat model validation"
const USAGE = "usage: validate-threat-model.mjs [path] [--root <dir>]"
const DEFAULT_THREAT_MODEL_PATH = "docs/threat-model.md"
const EXPECTED_HEADINGS = [
  "## Status",
  "## Executive summary",
  "## Scope and assumptions",
  "## System model",
  "## Assets",
  "## Attacker model",
  "## Entry points",
  "## Abuse paths",
  "## Threats",
  "## Priority calibration",
  "## Focus paths for review",
  "## Open questions",
]
const THREAT_FIELDS = [
  "Status",
  "Goal",
  "Prerequisites",
  "Action",
  "Impacted assets",
  "Existing controls",
  "Gap",
  "Recommended mitigation",
  "Detection",
  "Likelihood",
  "Impact",
  "Priority",
]
const PRIORITY_ORDER = new Map([
  ["critical", 0],
  ["high", 1],
  ["medium", 2],
  ["low", 3],
])
const VALID_STATUSES = new Set(["active", "mitigated", "accepted", "withdrawn"])
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1_000
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
const INDEX_ROW = /^\|\s*(TM-\d{3})\s*\|([^|\n]+)\|[^|\n]+\|([^|\n]+)\|([^|\n]+)\|\s*$/gm
const THREAT_SUBSECTION = /^### (TM-\d{3}) — (.+)$/gm
const CODE_SPAN = /`([^`\n]+)`/g
// A file path (a slash and a final extension starting with a letter) or a directory path (path-safe
// characters ending in a slash).
const FILE_PATH_SHAPE = /^(?:[^/].*\/[^/]*\.[A-Za-z][A-Za-z0-9]{0,9}|[A-Za-z0-9._-][A-Za-z0-9._\/-]*\/)$/
const GLOB_CHARACTERS = /[*?{}]/

class UsageError extends Error {}

function parseCommandLine(argv) {
  let parsed
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        root: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
    })
  } catch (error) {
    throw new UsageError(error.message)
  }

  if (parsed.positionals.length > 1) {
    throw new UsageError(`expected at most one path, found ${parsed.positionals.length}`)
  }

  return {
    help: parsed.values.help === true,
    root: parsed.values.root,
    path: parsed.positionals[0] ?? DEFAULT_THREAT_MODEL_PATH,
  }
}

function runGit(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" })
  if (result.error || result.status !== 0) {
    return undefined
  }

  return result.stdout.trim()
}

function resolveRepositoryRoot(rootOption) {
  if (rootOption !== undefined) {
    const root = resolve(rootOption)
    if (!existsSync(root) || !statSync(root).isDirectory()) {
      throw new UsageError(`repository root is not a directory: ${rootOption}`)
    }

    return root
  }

  const root = runGit(process.cwd(), ["rev-parse", "--show-toplevel"])
  if (!root) {
    throw new UsageError(
      "cannot find the repository root; run inside a Git repository or pass --root",
    )
  }

  return root
}

function countLines(content) {
  if (content === "") {
    return 0
  }

  const newlines = content.split("\n").length - 1
  return content.endsWith("\n") ? newlines : newlines + 1
}

function parseUtcTimestamp(value) {
  if (value === undefined || !UTC_TIMESTAMP.test(value)) {
    return undefined
  }

  // Date.parse rolls impossible dates such as February 30 forward; require a round trip.
  const time = Date.parse(value)
  if (Number.isNaN(time) || new Date(time).toISOString() !== value.replace("Z", ".000Z")) {
    return undefined
  }

  return time
}

function validateThreatModel(document, repositoryRoot) {
  const lines = document.split("\n")
  const failures = []

  function recordFailure(message) {
    if (!failures.includes(message)) {
      failures.push(message)
    }
  }

  function isLevelTwoHeading(line) {
    return /^## .+$/.test(line)
  }

  function readSection(heading) {
    const start = lines.indexOf(heading)
    if (start === -1) {
      return ""
    }

    let end = start + 1
    while (end < lines.length && !isLevelTwoHeading(lines[end])) {
      end += 1
    }

    return lines.slice(start + 1, end).join("\n")
  }

  function nextLevelTwoHeadingOffset(offset) {
    const match = /^## .+$/m.exec(document.slice(offset))
    return match ? offset + match.index : document.length
  }

  function validateHeadings() {
    const headings = lines.filter(isLevelTwoHeading)
    if (headings.length !== EXPECTED_HEADINGS.length) {
      recordFailure(
        `expected ${EXPECTED_HEADINGS.length} level-two headings, found ${headings.length}`,
      )
      return
    }

    for (const [index, heading] of EXPECTED_HEADINGS.entries()) {
      if (headings[index] !== heading) {
        recordFailure(
          `expected heading ${index + 1} to be "${heading}", found "${headings[index]}"`,
        )
      }
    }
  }

  function validateStatus() {
    const baseline = /^- Baseline commit: `([0-9a-f]{7,64})`$/m.exec(document)?.[1]
    const reviewedAt = /^- Reviewed at: (.+)$/m.exec(document)?.[1]
    const openAssumptions = /^- Open assumptions: (\d+)$/m.exec(document)?.[1]

    const baselineCommit =
      baseline === undefined
        ? undefined
        : runGit(repositoryRoot, ["rev-parse", "--verify", "--quiet", `${baseline}^{commit}`])
    if (!baselineCommit) {
      recordFailure("baseline commit does not resolve to a commit")
    }

    const reviewedTime = parseUtcTimestamp(reviewedAt)
    if (reviewedTime === undefined) {
      recordFailure("reviewed timestamp must be an ISO 8601 UTC timestamp (YYYY-MM-DDTHH:MM:SSZ)")
    } else {
      if (reviewedTime > Date.now() + MAX_CLOCK_SKEW_MS) {
        recordFailure("reviewed timestamp is in the future")
      }

      if (baselineCommit) {
        const committedAt = runGit(repositoryRoot, ["show", "-s", "--format=%cI", baselineCommit])
        if (committedAt && reviewedTime < Date.parse(committedAt)) {
          recordFailure("reviewed timestamp predates the baseline commit")
        }
      }
    }

    const questionCount = readSection("## Open questions").match(/^\d+\. /gm)?.length ?? 0
    if (openAssumptions === undefined || Number(openAssumptions) !== questionCount) {
      recordFailure(
        `open-assumption count does not match the ${questionCount} numbered open questions`,
      )
    }
  }

  function readThreatIndex() {
    const threats = readSection("## Threats")
    const firstThreat = threats.search(/^### TM-/m)
    const table = firstThreat === -1 ? threats : threats.slice(0, firstThreat)
    return [...table.matchAll(INDEX_ROW)].map((match) => ({
      id: match[1],
      title: match[2].trim(),
      priority: match[3].trim(),
      status: match[4].trim(),
    }))
  }

  function compareIndexEntries(left, right) {
    const priorityDifference =
      (PRIORITY_ORDER.get(left.priority) ?? Number.MAX_SAFE_INTEGER) -
      (PRIORITY_ORDER.get(right.priority) ?? Number.MAX_SAFE_INTEGER)
    if (priorityDifference !== 0) {
      return priorityDifference
    }

    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  }

  function validateThreats() {
    const entries = readThreatIndex()
    if (entries.length === 0) {
      recordFailure("threat index contains no entries")
      return
    }

    const ids = new Set()
    for (const entry of entries) {
      if (ids.has(entry.id)) {
        recordFailure(`threat index repeats ${entry.id}`)
      }

      ids.add(entry.id)

      if (!PRIORITY_ORDER.has(entry.priority)) {
        recordFailure(`${entry.id} has invalid priority "${entry.priority}"`)
      }

      if (!VALID_STATUSES.has(entry.status)) {
        recordFailure(`${entry.id} has invalid status "${entry.status}"`)
      }
    }

    const sortedEntries = [...entries].sort(compareIndexEntries)
    if (entries.some((entry, index) => entry.id !== sortedEntries[index].id)) {
      recordFailure("threat index is not ordered by priority, then ID")
    }

    const subsections = [...document.matchAll(THREAT_SUBSECTION)]
    const subsectionIds = subsections.map((match) => match[1])
    if (subsectionIds.join(",") !== [...ids].sort().join(",")) {
      recordFailure("threat index IDs do not match threat subsection IDs")
    }

    for (const [index, match] of subsections.entries()) {
      const id = match[1]
      const entry = entries.find((candidate) => candidate.id === id)
      if (!entry) {
        continue
      }

      if (entry.title !== match[2].trim()) {
        recordFailure(`${id} title differs between the index and subsection`)
      }

      const contentStart = match.index + match[0].length
      const contentEnd = Math.min(
        subsections[index + 1]?.index ?? document.length,
        nextLevelTwoHeadingOffset(contentStart),
      )
      const subsection = document.slice(contentStart, contentEnd)
      for (const field of THREAT_FIELDS) {
        if (!new RegExp(`^- ${field}:`, "m").test(subsection)) {
          recordFailure(`${id} is missing the ${field} field`)
        }
      }

      const status = /^- Status: (.+)$/m.exec(subsection)?.[1].trim()
      const priority = /^- Priority: (.+)$/m.exec(subsection)?.[1].trim()
      if (status !== entry.status) {
        recordFailure(`${id} status differs between the index and subsection`)
      }

      if (priority !== entry.priority) {
        recordFailure(`${id} priority differs between the index and subsection`)
      }
    }
  }

  // A backticked token is an evidence anchor when it reads as a repository-relative path, with an
  // optional :<line> suffix, whose first segment exists at the repository root. Prose identifiers,
  // routes, URLs, absolute paths, and globs are not anchors.
  function readEvidenceAnchor(token) {
    if (/\s/.test(token) || token.includes("://") || /^[/~]/.test(token)) {
      return undefined
    }

    const lineMatch = /^(.+):(\d+)$/.exec(token)
    const path = (lineMatch ? lineMatch[1] : token).replace(/^(?:\.\/)+/, "")
    const segments = path.split("/")
    if (path === "" || GLOB_CHARACTERS.test(path) || segments.includes("..")) {
      return undefined
    }

    // A span whose first segment exists at the root is a path anchor; so is a span shaped like a
    // file or directory path, so a missing top-level directory cannot hide a broken anchor. Other
    // spans (MIME types, protocol versions) are prose.
    const firstSegmentExists =
      segments[0] !== "" && existsSync(resolve(repositoryRoot, segments[0]))
    if (!firstSegmentExists && !FILE_PATH_SHAPE.test(path)) {
      return undefined
    }

    return { path, line: lineMatch ? Number(lineMatch[2]) : undefined }
  }

  function validateEvidencePaths() {
    const checked = new Set()
    for (const match of document.matchAll(CODE_SPAN)) {
      const token = match[1]
      if (checked.has(token)) {
        continue
      }

      checked.add(token)
      const anchor = readEvidenceAnchor(token)
      if (!anchor) {
        continue
      }

      const absolutePath = resolve(repositoryRoot, anchor.path)
      if (!existsSync(absolutePath)) {
        recordFailure(`evidence path does not exist: ${anchor.path}`)
        continue
      }

      if (anchor.line === undefined) {
        continue
      }

      if (!statSync(absolutePath).isFile()) {
        recordFailure(`evidence line anchors a directory: ${token}`)
        continue
      }

      const lineCount = countLines(readFileSync(absolutePath, "utf8"))
      if (anchor.line < 1 || anchor.line > lineCount) {
        recordFailure(`evidence line is outside ${anchor.path}: ${anchor.line}`)
      }
    }
  }

  validateHeadings()
  validateStatus()
  validateThreats()
  validateEvidencePaths()
  return failures
}

function main(argv) {
  let options
  let repositoryRoot
  try {
    options = parseCommandLine(argv)
    if (options.help) {
      console.log(USAGE)
      return 0
    }

    repositoryRoot = resolveRepositoryRoot(options.root)
  } catch (error) {
    if (!(error instanceof UsageError)) {
      throw error
    }

    console.error(`${PREFIX}: ${error.message}`)
    console.error(USAGE)
    return 2
  }

  const threatModelPath = resolve(repositoryRoot, options.path)
  const relativePath = relative(repositoryRoot, threatModelPath)
  const displayPath =
    relativePath.startsWith("..") || isAbsolute(relativePath) ? threatModelPath : relativePath

  let document
  try {
    document = readFileSync(threatModelPath, "utf8").replace(/\r\n?/g, "\n")
  } catch (error) {
    console.error(`${PREFIX}: cannot read ${displayPath}: ${error.code ?? error.message}`)
    return 1
  }

  const failures = validateThreatModel(document, repositoryRoot)
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`${PREFIX}: ${failure}`)
    }

    return 1
  }

  console.log(`${PREFIX}: passed`)
  return 0
}

process.exitCode = main(process.argv.slice(2))
