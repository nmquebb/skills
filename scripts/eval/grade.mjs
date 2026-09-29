// Graders. Programmatic graders are free and deterministic; judge graders batch a case's checkable
// claims into one call to a model from a different family than the one under test.
//
//   final    regex over the agent's final message: pattern, flags, match (contains | absent)
//   json     the final message holds one JSON object: required keys, enum values, nonEmpty arrays
//   events   count of normalized events of one kind (whose name, text, or path matches pattern)
//            within min..max
//   check    shell command run in the finished workspace; exit 0 passes
//   judge    one checkable claim the judge decides from the focus (final message by default)

import { spawnSync } from "node:child_process"

/** The last parseable JSON object in text: a fenced block first, else any balanced object. */
export function extractJson(text) {
  const source = String(text ?? "")
  const fenced = [...source.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g)].map((match) => match[1])
  for (const candidate of fenced.reverse()) {
    const parsed = tryParse(candidate)
    if (parsed && typeof parsed === "object") {
      return parsed
    }
  }

  const objects = []
  for (let start = source.indexOf("{"); start !== -1; start = source.indexOf("{", start + 1)) {
    const end = balancedEnd(source, start)
    if (end !== -1) {
      const parsed = tryParse(source.slice(start, end + 1))
      if (parsed && typeof parsed === "object") {
        objects.push({ start, end, parsed })
      }
    }
  }

  // Prefer the outermost object that ends last.
  objects.sort((left, right) => right.end - left.end || left.start - right.start)
  return objects[0]?.parsed ?? null
}

function tryParse(text) {
  try {
    return JSON.parse(text.trim())
  } catch {
    return null
  }
}

function balancedEnd(text, start) {
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < text.length; index++) {
    const character = text[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (character === "\\") {
        escaped = true
      } else if (character === '"') {
        inString = false
      }

      continue
    }

    if (character === '"') {
      inString = true
    } else if (character === "{") {
      depth++
    } else if (character === "}") {
      depth--
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

function eventMatches(event, pattern) {
  if (!pattern) {
    return true
  }

  return [event.name, event.text, event.path].some((value) => value !== undefined && pattern.test(value))
}

/** Grades one programmatic grader against a finished trial; judge graders are graded in batch. */
export function gradeOne(grader, trial) {
  switch (grader.type) {
    case "final": {
      const found = new RegExp(grader.pattern, grader.flags ?? "").test(trial.final ?? "")
      const passed = (grader.match ?? "contains") === "contains" ? found : !found
      return { passed, detail: found ? "pattern found" : "pattern absent" }
    }

    case "json": {
      const object = extractJson(trial.final)
      if (!object) {
        return { passed: false, detail: "no JSON object in the final message" }
      }

      const problems = []
      for (const key of grader.required ?? []) {
        if (!(key in object)) {
          problems.push(`missing ${key}`)
        }
      }

      for (const [key, allowed] of Object.entries(grader.enum ?? {})) {
        if (!allowed.includes(object[key])) {
          problems.push(`${key} is ${JSON.stringify(object[key])}, expected one of ${allowed.join(", ")}`)
        }
      }

      for (const key of grader.nonEmpty ?? []) {
        if (!Array.isArray(object[key]) || object[key].length === 0) {
          problems.push(`${key} is empty`)
        }
      }

      return { passed: problems.length === 0, detail: problems.join("; ") || "valid" }
    }

    case "events": {
      const pattern = grader.pattern ? new RegExp(grader.pattern, grader.flags ?? "") : null
      const count = trial.events.filter((event) => event.kind === grader.kind && eventMatches(event, pattern)).length
      const min = grader.min ?? 1
      const max = grader.max ?? Number.POSITIVE_INFINITY
      return { passed: count >= min && count <= max, detail: `${count} matching ${grader.kind} events` }
    }

    case "check": {
      if (!trial.workspace) {
        return { passed: false, detail: "no workspace to check" }
      }

      const result = spawnSync("sh", ["-c", grader.run], {
        cwd: trial.workspace,
        env: trial.checkEnvironment,
        encoding: "utf8",
        timeout: (grader.timeoutSeconds ?? 120) * 1000,
      })
      const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(-400)
      return { passed: result.status === 0, detail: output || `exit ${result.status}` }
    }

    default:
      throw new Error(`unknown grader type: ${grader.type}`)
  }
}

/** The judge's prompt for every judge grader of one trial. */
export function judgePrompt(graders, trial, context) {
  const claims = graders.map((grader) => `- ${grader.name}: ${grader.claim}`).join("\n")
  const sections = [
    "You are grading another agent's work against checkable claims. Decide each claim strictly from",
    "the evidence below: a claim passes only when the evidence itself shows it, and style, effort, or",
    "confident wording never substitutes for it. Do not run tools or explore; everything you need is",
    "here.",
    "",
    "Claims:",
    claims,
    "",
    "Evidence: the agent's final answer, between the markers.",
    "<<<ANSWER",
    trial.final || "(empty)",
    "ANSWER>>>",
  ]
  if (context) {
    sections.push("", "Context the claims refer to, between the markers.", "<<<CONTEXT", context, "CONTEXT>>>")
  }

  sections.push(
    "",
    "Reply with only one JSON object, no prose:",
    '{"claims": [{"id": "<claim id>", "pass": true, "evidence": "<short quote or reason>"}]}',
    "with one entry per claim id above.",
  )
  return sections.join("\n")
}

/** Verdicts by claim id from a judge's answer, or null when the answer is unusable. */
export function parseJudge(text, graders) {
  const object = extractJson(text)
  if (!object || !Array.isArray(object.claims)) {
    return null
  }

  const verdicts = new Map()
  for (const entry of object.claims) {
    if (entry && typeof entry.id === "string" && typeof entry.pass === "boolean") {
      verdicts.set(entry.id, { pass: entry.pass, evidence: String(entry.evidence ?? "") })
    }
  }

  return graders.every((grader) => verdicts.has(grader.name)) ? verdicts : null
}

/** Weighted score over graders with a verdict; a trial passes when every grader passed. */
export function score(results) {
  const graded = results.filter((result) => result.passed !== null)
  const total = graded.reduce((sum, result) => sum + (result.weight ?? 1), 0)
  const passed = graded.reduce((sum, result) => sum + (result.passed ? result.weight ?? 1 : 0), 0)
  return {
    score: total === 0 ? null : passed / total,
    passed: graded.length === results.length && graded.every((result) => result.passed),
    ungraded: results.length - graded.length,
  }
}
