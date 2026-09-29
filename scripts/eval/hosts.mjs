// Host adapters: how each agent CLI runs one prompt headlessly, and how its event stream
// normalizes. Supporting another agent means adding one entry with the same shape:
//
//   bin                      the CLI to run
//   family                   provider family; a judge must come from a different one
//   command(options)         { args, env } for one run in `options.cwd`
//   start()                  empty parse state
//   line(state, record)      folds one parsed stdout JSON line into the state; returns the
//                            normalized events it produced
//   finish(state)            { final, sessionId, models, usage, turns, error }
//   isolate(scratch)         optional: environment overrides that keep the user's own setup out
//
// Normalized events are { kind, name?, text?, path? } with kind one of message, skill, command,
// read, write, search, agent, or tool. A skill counts as loaded when the host's skill tool runs or
// the agent reads a skill's SKILL.md.

import { existsSync, mkdirSync, symlinkSync } from "node:fs"
import { join } from "node:path"

const SKILL_FILE = /(?:^|[\s'"=/])(?:\.agents|\.claude|\.codex)\/skills\/([a-z0-9][a-z0-9-]*)\/SKILL\.md/g

/** Skill names whose SKILL.md a command or path reads. */
export function skillsRead(text) {
  return [...String(text ?? "").matchAll(SKILL_FILE)].map((match) => match[1])
}

function plainSkillName(name) {
  return String(name ?? "").split(":").pop()
}

const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"])
const SEARCH_TOOLS = new Set(["Grep", "Glob"])
const AGENT_TOOLS = new Set(["Agent", "Task"])

const claude = {
  bin: "claude",
  family: "anthropic",

  command({ prompt, model, effort, maxTurns }) {
    const args = [
      "-p",
      prompt,
      "--model",
      model,
      "--effort",
      effort,
      "--output-format",
      "stream-json",
      "--verbose",
      // The user's settings, hooks, skills, and MCP servers stay out; project files still load.
      "--setting-sources",
      "project,local",
      "--strict-mcp-config",
      "--dangerously-skip-permissions",
      "--no-session-persistence",
    ]
    if (maxTurns) {
      args.push("--max-turns", String(maxTurns))
    }

    // The effort variable outranks --effort and every settings file, so an inherited value can
    // never override the arm.
    return { args, env: { CLAUDE_CODE_EFFORT_LEVEL: effort } }
  },

  start() {
    return { final: "", texts: [], models: new Set(), sessionId: null, usage: null, turns: null, error: null }
  },

  line(state, record) {
    const events = []
    if (record.type === "system" && record.subtype === "init") {
      state.sessionId = record.session_id ?? state.sessionId
    }

    if (record.type === "assistant" && record.message) {
      if (!record.parent_tool_use_id && record.message.model) {
        state.models.add(record.message.model)
      }

      for (const block of record.message.content ?? []) {
        if (block.type === "text" && block.text) {
          if (!record.parent_tool_use_id) {
            state.texts.push(block.text)
          }

          events.push({ kind: "message", text: block.text })
        }

        if (block.type === "tool_use") {
          events.push(...claudeTool(block.name, block.input ?? {}))
        }
      }
    }

    if (record.type === "result") {
      state.final = typeof record.result === "string" ? record.result : state.texts.at(-1) ?? ""
      state.turns = record.num_turns ?? null
      state.usage = claudeUsage(record)
      if (record.is_error) {
        state.error = record.terminal_reason ?? record.subtype ?? "error"
      }
    }

    return events
  },

  finish(state) {
    return {
      final: state.final || state.texts.at(-1) || "",
      sessionId: state.sessionId,
      models: [...state.models],
      usage: state.usage,
      turns: state.turns,
      error: state.error,
    }
  },
}

function claudeTool(name, input) {
  if (name === "Skill") {
    return [{ kind: "skill", name: plainSkillName(input.skill), via: "tool" }]
  }

  if (name === "Bash") {
    return [
      { kind: "command", text: input.command ?? "" },
      ...skillsRead(input.command).map((skill) => ({ kind: "skill", name: skill, via: "read" })),
    ]
  }

  if (name === "Read") {
    return [
      { kind: "read", path: input.file_path ?? "" },
      ...skillsRead(`/${input.file_path ?? ""}`).map((skill) => ({ kind: "skill", name: skill, via: "read" })),
    ]
  }

  if (WRITE_TOOLS.has(name)) {
    return [{ kind: "write", path: input.file_path ?? input.notebook_path ?? "" }]
  }

  if (SEARCH_TOOLS.has(name)) {
    return [{ kind: "search", text: input.pattern ?? "" }]
  }

  if (AGENT_TOOLS.has(name)) {
    return [{ kind: "agent", name: input.subagent_type ?? "" }]
  }

  return [{ kind: "tool", name }]
}

/**
 * Totals across the main loop and any subagents, from the final result record. Claude counts cache
 * reads and writes apart from input; `input` adds them back so it means total input on every host,
 * with `cachedInput` and `cacheWrite` as subsets.
 */
function claudeUsage(record) {
  const models = Object.values(record.modelUsage ?? {})
  const usage = record.usage ?? {}
  const sum = (key) => models.reduce((total, entry) => total + (entry[key] ?? 0), 0)
  const fresh = models.length > 0 ? sum("inputTokens") : usage.input_tokens ?? 0
  const cachedInput = models.length > 0 ? sum("cacheReadInputTokens") : usage.cache_read_input_tokens ?? 0
  const cacheWrite = models.length > 0 ? sum("cacheCreationInputTokens") : usage.cache_creation_input_tokens ?? 0
  return {
    input: fresh + cachedInput + cacheWrite,
    cachedInput,
    cacheWrite,
    output: models.length > 0 ? sum("outputTokens") : usage.output_tokens ?? 0,
    reasoning: models.length > 0 ? sum("thinkingTokens") : usage.output_tokens_details?.thinking_tokens ?? null,
    costUsd: record.total_cost_usd ?? null,
  }
}

const codex = {
  bin: "codex",
  family: "openai",

  command({ prompt, model, effort, cwd, sandbox }) {
    return {
      args: [
        "exec",
        "--json",
        // No rollout on disk, and none of the user's config.toml (profiles, MCP servers, hooks).
        "--ephemeral",
        "--ignore-user-config",
        "--skip-git-repo-check",
        "-C",
        cwd,
        "-m",
        model,
        "-c",
        `model_reasoning_effort="${effort}"`,
        "-c",
        'approval_policy="never"',
        "-s",
        sandbox ?? "workspace-write",
        prompt,
      ],
      env: {},
    }
  },

  /**
   * A throwaway home holding only a link to the login, so the user's skills (~/.agents/skills,
   * ~/.codex/skills), AGENTS.md, and config stay out of trials; skills under test are project skills.
   */
  isolate(scratch, source = process.env) {
    const home = join(scratch, "codex-home")
    const codexHome = join(home, ".codex")
    mkdirSync(codexHome, { recursive: true })
    const auth = join(source.CODEX_HOME ?? join(source.HOME ?? "", ".codex"), "auth.json")
    if (existsSync(auth)) {
      symlinkSync(auth, join(codexHome, "auth.json"))
    }

    return { HOME: home, CODEX_HOME: codexHome }
  },

  start() {
    return { final: "", sessionId: null, usage: null, turns: 0, error: null }
  },

  line(state, record) {
    const events = []
    if (record.type === "thread.started") {
      state.sessionId = record.thread_id ?? state.sessionId
    }

    if (record.type === "turn.completed") {
      state.turns += 1
      const usage = record.usage ?? {}
      const total = state.usage ?? { input: 0, cachedInput: 0, cacheWrite: 0, output: 0, reasoning: 0, costUsd: null }
      total.input += usage.input_tokens ?? 0
      total.cachedInput += usage.cached_input_tokens ?? 0
      total.cacheWrite += usage.cache_write_input_tokens ?? 0
      total.output += usage.output_tokens ?? 0
      total.reasoning += usage.reasoning_output_tokens ?? 0
      state.usage = total
    }

    if (record.type === "turn.failed" || record.type === "error") {
      state.error = record.error?.message ?? record.message ?? record.type
    }

    if (record.type === "item.completed" && record.item) {
      events.push(...codexItem(record.item, state))
    }

    return events
  },

  finish(state) {
    // Codex's stream names no model or effort; the requested route stands unverified.
    return {
      final: state.final,
      sessionId: state.sessionId,
      models: [],
      usage: state.usage,
      turns: state.turns,
      error: state.final ? null : state.error,
    }
  },
}

function codexItem(item, state) {
  switch (item.type) {
    case "agent_message":
      state.final = item.text ?? ""
      return [{ kind: "message", text: item.text ?? "" }]
    case "command_execution":
      // A read that failed (a guessed path) loaded nothing.
      return [
        { kind: "command", text: item.command ?? "" },
        ...(item.exit_code === 0 || item.exit_code === undefined ? skillsRead(item.command) : []).map((skill) => ({
          kind: "skill",
          name: skill,
          via: "read",
        })),
      ]
    case "file_change":
      return (item.changes ?? []).map((change) => ({ kind: "write", path: change.path ?? "" }))
    case "mcp_tool_call":
      return [{ kind: "tool", name: `${item.server}.${item.tool}` }]
    case "web_search":
      return [{ kind: "tool", name: "web_search" }]
    default:
      return []
  }
}

export const HOSTS = { claude, codex }

/** The environment every agent run starts from: enough to find tools and credentials, nothing else. */
export function baseEnvironment(source = process.env) {
  const keep = ["HOME", "USER", "LOGNAME", "SHELL", "PATH", "TMPDIR", "LANG", "LC_ALL", "LC_CTYPE", "TERM"]
  const environment = {}
  for (const key of keep) {
    if (source[key] !== undefined) {
      environment[key] = source[key]
    }
  }

  return environment
}
