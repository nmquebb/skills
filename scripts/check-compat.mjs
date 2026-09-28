#!/usr/bin/env node
// Compares the working tree's public API with a channel branch. It fails on a breaking change: a
// removed skill, a changed invocation policy, a removed configuration key, enumeration value, or
// version, a changed static default, a removed marker, or a removed artifact-format heading or
// field. Semantic changes it cannot classify (a conditional default's wording, or the guarded
// authority, precedence, detection, and review-independence sections) pass only with a
// `Compat-Reviewed: <reason>` trailer on a commit since the base, or `--reviewed "<reason>"` for a
// local run before committing. See docs/distribution.md#compatibility-contract.
// Usage: node scripts/check-compat.mjs <base-ref> [--reviewed "<reason>"]   (for example origin/v1)

import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SCHEMA_PATH = "skills/q-workflow/references/config.schema.json"
const MARKER = /\bq-[a-z]+(?:-[a-z]+)*:v\d+\b/g
const FORMAT_FILE = /(?:references\/(?:artifact-format|plan-format|archive-format|reconciliation-record|threat-model-format)\.md|backends\/tracker-local\.md|q-roadmap\/references\/local\.md)$/
const GUARDED_SECTIONS = [
  ["skills/q-workflow/references/lifecycle.md", "User authority"],
  ["skills/q-workflow/references/lifecycle.md", "Delivery policy"],
  ["skills/q-workflow/references/lifecycle.md", "Authority"],
  ["skills/q-workflow/references/config.md", "Precedence"],
  ["skills/q-workflow/references/config.md", "Defaults and detection"],
  ["skills/q-workflow/references/config.md", "Valid combinations"],
  ["skills/q-workflow/references/orchestration.md", "Routing rules"],
]
const TRAILER = /^Compat-Reviewed:[ \t]*\S.*$/m

const [baseRef, flag, reason] = process.argv.slice(2)
if (!baseRef || (flag !== undefined && (flag !== "--reviewed" || !reason))) {
  console.error('usage: check-compat.mjs <base-ref> [--reviewed "<reason>"]')
  process.exit(2)
}

function git(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  return result.status === 0 ? result.stdout : undefined
}

if (git(["rev-parse", "--verify", "--quiet", `${baseRef}^{commit}`]) === undefined) {
  console.log(`check-compat: ${baseRef} does not exist; nothing to compare`)
  process.exit(0)
}

const baseFiles = git(["ls-tree", "-r", "--name-only", baseRef, "skills/"]).split("\n").filter(Boolean)

function readBase(path) {
  return git(["show", `${baseRef}:${path}`])
}

function readCurrent(path) {
  const absolute = join(ROOT, path)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : undefined
}

function listCurrentFiles(directory) {
  const files = []

  for (const entry of readdirSync(join(ROOT, directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) {
      files.push(...listCurrentFiles(path))
      continue
    }

    files.push(path)
  }

  return files
}

const breaks = []
const needsReview = []

function explicitOnly(skillText) {
  return /^disable-model-invocation:\s*true\s*$/m.test(skillText)
}

function checkSkills() {
  const baseSkills = baseFiles.filter((path) => /^skills\/[^/]+\/SKILL\.md$/.test(path))

  for (const path of baseSkills) {
    const name = path.split("/")[1]
    const current = readCurrent(path)
    if (current === undefined) {
      breaks.push(`skill ${name} was removed or renamed (keep a stub that redirects to its replacement)`)
      continue
    }

    if (explicitOnly(readBase(path)) !== explicitOnly(current)) {
      breaks.push(`skill ${name} changed its invocation policy (explicit-only vs model-invocable)`)
    }
  }
}

/** Flattens a JSON Schema into path → { enum } entries for every declared property. */
function schemaSurface(schema, prefix = "", surface = new Map()) {
  for (const [key, child] of Object.entries(schema.properties ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key
    surface.set(path, {
      enum: child.enum,
      const: child.const,
      default: child.default,
      conditionalDefault: child["x-default"],
    })
    schemaSurface(child, path, surface)
    if (child.items) {
      schemaSurface(child.items, `${path}[]`, surface)
    }

    if (child.propertyNames?.enum) {
      surface.set(`${path}{keys}`, { enum: child.propertyNames.enum })
    }
  }

  return surface
}

function checkConfiguration() {
  const baseText = readBase(SCHEMA_PATH)
  const currentText = readCurrent(SCHEMA_PATH)
  if (baseText === undefined) {
    return
  }

  if (currentText === undefined) {
    breaks.push(`${SCHEMA_PATH} was removed`)
    return
  }

  const base = schemaSurface(JSON.parse(baseText))
  const current = schemaSurface(JSON.parse(currentText))
  for (const [path, entry] of base) {
    const now = current.get(path)
    if (!now) {
      breaks.push(`configuration key ${path} was removed or renamed`)
      continue
    }

    if (entry.const !== undefined && entry.const !== now.const) {
      breaks.push(`configuration ${path} changed from ${entry.const} to ${now.const} (a new major)`)
    }

    for (const value of entry.enum ?? []) {
      if (!(now.enum ?? []).includes(value)) {
        breaks.push(`configuration ${path} no longer accepts "${value}"`)
      }
    }

    if (entry.default !== undefined && JSON.stringify(entry.default) !== JSON.stringify(now.default)) {
      breaks.push(`configuration ${path} default changed from ${JSON.stringify(entry.default)}`)
    }

    if (entry.conditionalDefault !== undefined && entry.conditionalDefault !== now.conditionalDefault) {
      needsReview.push({ file: SCHEMA_PATH, message: `configuration ${path} conditional default reads differently` })
    }
  }
}

function markersIn(texts) {
  const markers = new Set()

  for (const text of texts) {
    for (const marker of text.match(MARKER) ?? []) {
      markers.add(marker)
    }
  }

  return markers
}

function checkMarkers() {
  const base = markersIn(baseFiles.map(readBase).filter(Boolean))
  const current = markersIn(listCurrentFiles("skills").map(readCurrent).filter(Boolean))
  for (const marker of base) {
    if (!current.has(marker)) {
      breaks.push(`marker ${marker} is no longer documented; readers must keep accepting it`)
    }
  }
}

/** Headings and `- Label:` fields inside fenced blocks: the formats written into repositories. */
function formatFields(markdown) {
  const fields = new Set()
  let fenced = false

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced
      continue
    }

    if (!fenced) {
      continue
    }

    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
    if (heading && !heading[2].includes("<")) {
      fields.add(`${heading[1]} ${heading[2]}`)
      continue
    }

    const field = /^- ([A-Z][^:<]{0,60}):/.exec(line)
    if (field) {
      fields.add(`- ${field[1]}:`)
    }
  }

  return fields
}

function checkFormats() {
  for (const path of baseFiles.filter((file) => FORMAT_FILE.test(file))) {
    const current = readCurrent(path)
    if (current === undefined) {
      breaks.push(`format reference ${path} was removed or moved`)
      continue
    }

    const now = formatFields(current)
    for (const field of formatFields(readBase(path))) {
      if (!now.has(field)) {
        breaks.push(`${path}: format field "${field}" was removed or renamed`)
      }
    }
  }
}

/** One section's text, whitespace-collapsed so rewrapping never counts as a change. */
function sectionText(markdown, heading) {
  const lines = markdown.split("\n")
  const start = lines.findIndex((line) => new RegExp(`^(#{1,6})\\s+${heading}\\s*$`).test(line))
  if (start === -1) {
    return undefined
  }

  const level = /^#+/.exec(lines[start])[0].length
  const end = lines.findIndex((line, index) => index > start && /^(#{1,6})\s/.test(line) && /^#+/.exec(line)[0].length <= level)
  return lines.slice(start + 1, end === -1 ? undefined : end).join(" ").replace(/\s+/g, " ").trim()
}

function checkGuardedSections() {
  for (const [path, heading] of GUARDED_SECTIONS) {
    const baseText = readBase(path)
    if (baseText === undefined) {
      continue
    }

    const before = sectionText(baseText, heading)
    const after = sectionText(readCurrent(path) ?? "", heading)
    if (before !== undefined && before !== after) {
      needsReview.push({ file: path, message: `${path} section "${heading}" changed` })
    }
  }
}

/**
 * The review trailer that covers the current semantic changes: `--reviewed`, or a
 * `Compat-Reviewed:` trailer on the latest commit that touched the changed files or a later one.
 * An older trailer never covers a later change, and uncommitted changes need `--reviewed`.
 */
function attestation() {
  if (reason) {
    return reason
  }

  const files = [...new Set(needsReview.map((item) => item.file))]
  if ((git(["status", "--porcelain", "--", ...files]) ?? "").trim() !== "") {
    return undefined
  }

  const latestTouch = (git(["log", "-1", "--format=%H", `${baseRef}..HEAD`, "--", ...files]) ?? "").trim()
  const commits = (git(["log", "--format=%H%x1f%B%x1e", `${baseRef}..HEAD`]) ?? "").split("\x1e")
  for (const entry of commits) {
    const [hash, message = ""] = entry.trim().split("\x1f")
    const trailer = TRAILER.exec(message)?.[0]
    if (trailer) {
      return trailer
    }

    if (!hash || hash === latestTouch) {
      return undefined
    }
  }

  return undefined
}

checkSkills()
checkConfiguration()
checkMarkers()
checkFormats()
checkGuardedSections()

const reviewed = needsReview.length > 0 ? attestation() : undefined
for (const item of needsReview) {
  const print = reviewed ? console.log : console.error
  print(`check-compat: ${item.message}; ${reviewed ? `reviewed as compatible (${reviewed.trim()})` : "needs review"}`)
}

for (const problem of breaks) {
  console.error(`check-compat: ${problem}`)
}

if (breaks.length > 0) {
  console.error(
    `check-compat: ${breaks.length} breaking change(s) against ${baseRef}. Make them compatible, ` +
      "or follow docs/distribution.md#breaking-changes to start the next major channel.",
  )
}

if (needsReview.length > 0 && !reviewed) {
  console.error(
    "check-compat: confirm the changes above alter no default or authority, then add a " +
      '"Compat-Reviewed: <reason>" trailer to the latest commit that changes them, or a later one ' +
      '(pass --reviewed "<reason>" for uncommitted changes).',
  )
}

if (breaks.length > 0 || (needsReview.length > 0 && !reviewed)) {
  process.exit(1)
}

console.log(`check-compat: compatible with ${baseRef}`)
