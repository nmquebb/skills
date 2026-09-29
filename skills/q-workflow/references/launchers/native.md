# Native Launcher

Use the host's built-in subagent mechanism. Routes name the host's own models.

## Claude Code

- Launch with the Agent (Task) tool. Give the complete bounded contract in the prompt; the child has
  no transcript.
- The Agent tool's `model` takes only the host's aliases (`opus`, `sonnet`, `haiku`, `fable`), and
  the call takes no effort: a child inherits the session's effort. A full model ID or an effort
  applies only through an agent definition (`model` and `effort` in `.claude/agents/<name>.md`
  frontmatter) launched as the child's type; without one, launch the route's alias and record its
  effort as advisory.
- Read-only roles: use a read-only agent type when one exists (such as `Explore` or `Plan`), and
  state in the prompt that the role must not edit, commit, or launch agents.
- Run independent children in one message so they start concurrently; run background children for
  long work and continue other owner work until notified.

## Codex

- Launch with the native sub-agent tool (`spawn_agent`) with `fork_turns: "none"` so the child
  starts from a fresh context, passing the route's `model` and `reasoning_effort`, and a read-only
  instruction for review roles. An `agent_type` whose definition (`.codex/agents/<name>.toml`) sets
  `model_reasoning_effort` overrides the passed effort. Take its final answer with a long
  `wait_agent`, then close it. Record the task name and child thread ID.
- On hosts with goal tools, the full-lifecycle owner keeps one goal active across slices as
  [`q-implement`](../../../q-implement/references/orchestration-protocol.md#keep-one-continuous-goal)
  describes.

## pi and hosts without a subagent tool

pi's built-in tools (`read`, `bash`, `edit`, and `write` by default; `grep`, `find`, and `ls` when
enabled) include no subagent tool. When an installed extension provides one (for example
`subagent` from `pi-subagents`, or `Agent` from `@tintinweb/pi-subagents`), use it with a fresh
context and follow its launch and wait semantics. Without one:

- the owner performs each supporting role itself, sequentially, re-reading the role's contract and
  sources from disk before starting it and discarding reliance on its own earlier conclusions;
- slice reviews the owner performs this way are recorded as `self-review (no independent agent)`;
  and
- self-review never satisfies an independent-review gate: stop there and present the choices in
  [Routing rules](../orchestration.md#routing-rules) (a session the user starts, another launcher,
  or a recorded waiver).

## Structured results

When a role must return JSON, paste the exact schema contents into its prompt; a schema path alone
produces malformed results. Validate the direct answer against the schema and its semantic
invariants before using it.
