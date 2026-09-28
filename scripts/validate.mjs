#!/usr/bin/env node
// Validates the q skill suite: skill structure, frontmatter, invocation policy, links, skill
// references, project-specific leaks, scripts, and plugin manifests. Node 20+, no dependencies.
// Usage: node scripts/validate.mjs

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SKILLS_ROOT = join(ROOT, "skills")
const SKILL_PREFIX = "q-"
const MAX_BODY_LINES = 500
const MAX_DESCRIPTION_LENGTH = 1024
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "license",
  "metadata",
  "allowed-tools",
  "disable-model-invocation",
])

const OPENAI_YAML_KEYS = new Set(["interface", "policy", "dependencies"])

// Standalone skills may link only into their own folder, q-workflow (optional detail), and the
// listed dependencies.
const STANDALONE_DEPENDENCIES = new Map([
  ["q-code-quality", ["q-tdd"]],
  ["q-tdd", ["q-code-quality"]],
  ["q-adversarial", []],
  ["q-threat-model", []],
  ["q-computer-use", []],
])

// q-prefixed identifiers that are not skills: markers, paths, and the marketplace name.
const NON_SKILL_IDENTIFIERS = new Set([
  "q-lifecycle",
  "q-triage-proposal",
  "q-reconcile-complete",
  "q-archive-complete",
  "q-evidence",
  "q-skills",
])

// Project-specific or time-sensitive text that must never ship inside a skill.
const FORBIDDEN_PATTERNS = [
  [/hypework/i, "project name from the source project"],
  [/\/Users\/|\/home\/[a-z]/, "absolute home path"],
  [/\b(?:gpt-\d|claude-(?:opus|sonnet|haiku|fable)-\d|(?:opus|sonnet|haiku|fable)-\d)/i, "pinned model ID"],
  [/\$\{CLAUDE_[A-Z_]+\}/, "Claude Code variable (not portable)"],
  [/\.agents\/skills\/q-[a-z-]+\/(?:scripts|references|templates)/, "install-location path (not portable)"],
]

const failures = []

function fail(path, message) {
  failures.push(`${relative(ROOT, path) || "."}: ${message}`)
}

function listFiles(directory) {
  const files = []

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(path))
      continue
    }

    files.push(path)
  }

  return files
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch (error) {
    fail(path, `invalid JSON: ${error.message}`)
    return undefined
  }
}

/** Parses the flat `key: value` frontmatter the suite allows; values are strings. */
function parseFrontmatter(path, text) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text)
  if (!match) {
    fail(path, "missing YAML frontmatter delimited by --- lines")
    return undefined
  }

  const fields = new Map()
  for (const line of match[1].split("\n")) {
    const field = /^([a-z-]+):\s*(.*)$/.exec(line)
    if (!field) {
      fail(path, `unsupported frontmatter line: ${line}`)
      continue
    }

    if (fields.has(field[1])) {
      fail(path, `duplicate frontmatter key: ${field[1]}`)
    }

    fields.set(field[1], field[2])
  }

  return { fields, body: text.slice(match[0].length) }
}

function unquote(path, key, raw) {
  const quoted = /^"((?:[^"\\]|\\.)*)"$/.exec(raw)
  if (!quoted) {
    fail(path, `${key} must be a double-quoted string (pi rejects YAML that is not strict)`)
    return raw
  }

  return quoted[1].replace(/\\(.)/g, "$1")
}

/** GitHub-style heading anchors, including -1, -2 suffixes for duplicates. */
function headingAnchors(markdown) {
  const anchors = new Set()
  const counts = new Map()

  for (const line of stripFences(markdown).split("\n")) {
    const heading = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line)
    if (!heading) {
      continue
    }

    const base = heading[1]
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-")
    const seen = counts.get(base) ?? 0
    counts.set(base, seen + 1)
    anchors.add(seen === 0 ? base : `${base}-${seen}`)
  }

  return anchors
}

function stripFences(markdown) {
  return markdown.replace(/^\s*(```|~~~)[\s\S]*?^\s*\1\s*$/gm, "")
}

function stripCode(markdown) {
  return stripFences(markdown).replace(/`[^`\n]*`/g, "")
}

function skillOf(path) {
  const segments = relative(SKILLS_ROOT, path).split(sep)
  return segments[0]
}

function validateLinks(file, markdown, skillNames) {
  const sourceSkill = skillOf(file)
  const allowedSkills = STANDALONE_DEPENDENCIES.has(sourceSkill)
    ? new Set([sourceSkill, "q-workflow", ...STANDALONE_DEPENDENCIES.get(sourceSkill)])
    : undefined

  for (const match of stripCode(markdown).matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1]
    if (/^(?:https?:|mailto:)/.test(target)) {
      continue
    }

    const [pathPart, anchor] = target.split("#")
    const resolved = pathPart ? resolve(dirname(file), pathPart) : file
    if (!resolved.startsWith(SKILLS_ROOT + sep)) {
      fail(file, `link escapes skills/ and breaks once installed: ${target}`)
      continue
    }

    if (!existsSync(resolved)) {
      fail(file, `broken link: ${target}`)
      continue
    }

    const targetSkill = skillOf(resolved)
    if (!skillNames.has(targetSkill)) {
      fail(file, `link into a folder that is not a skill: ${target}`)
    }

    if (allowedSkills && !allowedSkills.has(targetSkill)) {
      fail(file, `standalone skill ${sourceSkill} depends on ${targetSkill}: ${target}`)
    }

    if (anchor && resolved.endsWith(".md") && statSync(resolved).isFile()) {
      const anchors = headingAnchors(readFileSync(resolved, "utf8"))
      if (!anchors.has(anchor)) {
        fail(file, `missing anchor #${anchor} in ${relative(ROOT, resolved)}`)
      }
    }
  }
}

function validateText(file, text, skillNames) {
  for (const [pattern, reason] of FORBIDDEN_PATTERNS) {
    const match = pattern.exec(text)
    if (match) {
      fail(file, `${reason}: "${match[0]}"`)
    }
  }

  for (const match of text.matchAll(/(?<![\w/.-])q-[a-z][a-z0-9]*(?:-[a-z0-9]+)*/g)) {
    const identifier = match[0]
    if (!skillNames.has(identifier) && !NON_SKILL_IDENTIFIERS.has(identifier)) {
      fail(file, `unknown q identifier "${identifier}" (not a skill or a known marker)`)
    }
  }
}

function validateOpenAiYaml(directory, name, explicitOnly) {
  const path = join(directory, "agents", "openai.yaml")
  if (!existsSync(path)) {
    fail(directory, "missing agents/openai.yaml (Codex interface metadata)")
    return
  }

  const text = readFileSync(path, "utf8")
  const topLevelKeys = text.match(/^[a-z_]+(?=:)/gm) ?? []
  if (new Set(topLevelKeys).size !== topLevelKeys.length) {
    fail(path, "duplicate top-level key")
  }

  const unexpected = topLevelKeys.filter((key) => !OPENAI_YAML_KEYS.has(key))
  if (!topLevelKeys.includes("interface") || unexpected.length > 0) {
    fail(path, "top level must be interface, plus optional policy and dependencies")
  }

  for (const key of ["display_name", "short_description", "default_prompt"]) {
    if (!new RegExp(`^interface:\\n(?:  .*\\n)*  ${key}: ".+"$`, "m").test(text)) {
      fail(path, `interface.${key} must be a double-quoted string under interface`)
    }
  }

  if (!text.includes(`$${name}`)) {
    fail(path, `default_prompt should invoke $${name}`)
  }

  const hidden = /^policy:\n(?:  .*\n)*  allow_implicit_invocation: false\s*$/m.test(text)
  if (explicitOnly !== hidden) {
    fail(
      path,
      explicitOnly
        ? "explicit-only skill must set policy.allow_implicit_invocation: false"
        : "implicit skill must not set allow_implicit_invocation: false",
    )
  }
}

function validateSkill(directory, skillNames) {
  const name = directory.split(sep).at(-1)
  const skillPath = join(directory, "SKILL.md")
  if (!existsSync(skillPath)) {
    fail(directory, "missing SKILL.md")
    return
  }

  const text = readFileSync(skillPath, "utf8")
  const parsed = parseFrontmatter(skillPath, text)
  if (!parsed) {
    return
  }

  const { fields, body } = parsed
  for (const key of fields.keys()) {
    if (!FRONTMATTER_KEYS.has(key)) {
      fail(skillPath, `unsupported frontmatter key: ${key}`)
    }
  }

  const declaredName = fields.get("name")
  if (declaredName !== name) {
    fail(skillPath, `name "${declaredName}" must equal the folder name "${name}"`)
  }

  if (!name.startsWith(SKILL_PREFIX) || !NAME_PATTERN.test(name) || name.length > 64) {
    fail(skillPath, `name must match ${SKILL_PREFIX}<kebab-case>, at most 64 characters`)
  }

  if (!fields.has("description")) {
    fail(skillPath, "missing description")
  } else {
    const description = unquote(skillPath, "description", fields.get("description"))
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      fail(skillPath, `description is ${description.length} characters; maximum is 1024`)
    }

    if (/[<>]/.test(description)) {
      fail(skillPath, "description must not contain angle brackets")
    }
  }

  if (fields.get("license") !== "MIT") {
    fail(skillPath, "license must be MIT")
  }

  const invocation = fields.get("disable-model-invocation")
  if (invocation !== undefined && invocation !== "true") {
    fail(skillPath, "disable-model-invocation must be true when present")
  }

  const bodyLines = body.split("\n").length
  if (bodyLines > MAX_BODY_LINES) {
    fail(skillPath, `body has ${bodyLines} lines; maximum is ${MAX_BODY_LINES}`)
  }

  validateOpenAiYaml(directory, name, invocation === "true")

  for (const file of listFiles(directory)) {
    const relativePath = relative(directory, file)
    const base = file.split(sep).at(-1)
    if (base === "metadata.json") {
      fail(file, "the skills CLI drops files named metadata.json")
    }

    if (base === "SKILL.md" && relativePath !== "SKILL.md") {
      fail(file, "nested SKILL.md registers as another skill in Codex")
    }

    if (base === ".DS_Store") {
      fail(file, "remove .DS_Store")
      continue
    }

    const content = readFileSync(file, "utf8")
    if (file.endsWith(".json")) {
      readJson(file)
    }

    if (content.startsWith("#!") && (statSync(file).mode & 0o111) === 0) {
      fail(file, "script with a shebang must be executable")
    }

    if (/\.(md|yaml|yml|json|sh|mjs|js)$/.test(file)) {
      validateText(file, content, skillNames)
    }

    if (file.endsWith(".md")) {
      validateLinks(file, content, skillNames)
    }
  }
}

/** Markdown cell text without links, code spans, or extra whitespace, for comparing defaults. */
function plainText(markdown) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replaceAll("`", "")
    .replace(/\s+/g, " ")
    .trim()
}

function renderDefault(value) {
  return typeof value === "string" ? value : JSON.stringify(value)
}

/** The schema is the machine-checked source of defaults; the documentation tables must agree. */
function validateConfigDefaults() {
  const schemaPath = join(SKILLS_ROOT, "q-workflow", "references", "config.schema.json")
  const configPath = join(SKILLS_ROOT, "q-workflow", "references", "config.md")
  const labelsPath = join(SKILLS_ROOT, "q-workflow", "references", "backends", "tracker-github.md")
  const schema = readJson(schemaPath)
  if (!schema) {
    return
  }

  const nodeAt = (path) =>
    path.split(".").reduce((node, part) => node?.properties?.[part], { properties: schema.properties })

  let header
  for (const line of readFileSync(configPath, "utf8").split("\n")) {
    if (!line.startsWith("|")) {
      header = undefined
      continue
    }

    const cells = line.slice(1, -1).split("|").map((cell) => cell.trim())
    if (cells[0] === "Key") {
      header = cells
      continue
    }

    const defaultColumn = header?.indexOf("Default") ?? -1
    const key = /^`([^`]+)`$/.exec(cells[0])?.[1]
    if (defaultColumn === -1 || !key || key.includes("<")) {
      continue
    }

    const node = nodeAt(key)
    if (!node) {
      fail(configPath, `documents ${key}, which the schema does not define`)
      continue
    }

    const expected =
      node.default !== undefined ? renderDefault(node.default) : node["x-default"]
    if (expected === undefined) {
      fail(schemaPath, `${key} needs a default or x-default annotation`)
    } else if (plainText(cells[defaultColumn]) !== plainText(expected)) {
      fail(configPath, `default for ${key} disagrees with the schema ("${expected}")`)
    }
  }

  const labels = nodeAt("tracker.labels")?.properties ?? {}
  for (const line of readFileSync(labelsPath, "utf8").split("\n")) {
    const row = /^\| `(\w+)` \| `([^`]+)` \|/.exec(line)
    if (row && labels[row[1]] && labels[row[1]].default !== row[2]) {
      fail(labelsPath, `label for ${row[1]} disagrees with the schema default "${labels[row[1]].default}"`)
    }
  }
}

function validateManifests(skillNames) {
  const pluginPath = join(ROOT, ".claude-plugin", "plugin.json")
  const marketplacePath = join(ROOT, ".claude-plugin", "marketplace.json")
  const plugin = existsSync(pluginPath) ? readJson(pluginPath) : fail(pluginPath, "missing")
  const marketplace = existsSync(marketplacePath)
    ? readJson(marketplacePath)
    : fail(marketplacePath, "missing")
  if (!plugin || !marketplace) {
    return
  }

  if ("version" in plugin) {
    fail(pluginPath, "omit version: users track commits, and a stale version freezes updates")
  }

  const entry = marketplace.plugins?.find((candidate) => candidate.name === plugin.name)
  if (!entry) {
    fail(marketplacePath, `no plugin entry named "${plugin.name}"`)
  } else {
    if ("version" in entry) {
      fail(marketplacePath, "omit the entry version; plugin.json owns identity and users track commits")
    }

    if (entry.source !== "./" && entry.source !== ".") {
      fail(marketplacePath, 'plugin source must be the repository root ("./")')
    }
  }

  const readme = readFileSync(join(ROOT, "README.md"), "utf8")
  for (const name of skillNames) {
    if (!readme.includes(`\`${name}\``)) {
      fail(join(ROOT, "README.md"), `catalog does not list \`${name}\``)
    }
  }

  if (!existsSync(join(ROOT, "CHANGELOG.md"))) {
    fail(join(ROOT, "CHANGELOG.md"), "missing")
  }
}

const skillDirectories = readdirSync(SKILLS_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(SKILLS_ROOT, entry.name))
const skillNames = new Set(skillDirectories.map((directory) => directory.split(sep).at(-1)))

for (const directory of skillDirectories) {
  validateSkill(directory, skillNames)
}

validateConfigDefaults()
validateManifests(skillNames)

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`validate: ${failure}`)
  }

  console.error(`validate: ${failures.length} problem(s) in ${skillNames.size} skills`)
  process.exit(1)
}

console.log(`validate: ${skillNames.size} skills passed`)
