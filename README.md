# q skills

Focused skills for turning an idea into working software. Spec, Plan, and Implement can be used
separately or together. They do not require a tracker, ledger, prescribed artifact location, or
phase approval.

## Skills

| Skill | Invocation | What it does |
| --- | --- | --- |
| `q-spec` | explicit | Clarify the outcome and write a proportional spec at the user's chosen location |
| `q-plan` | explicit | Plan from freeform text, a spec file, or a stated outcome |
| `q-implement` | explicit | Implement a direct request, pasted plan, or plan file |
| `q-workflow` | explicit | Explain or configure optional project conventions |
| `q-code-quality` | on request or when warranted | Review a code change against project conventions |
| `q-tdd` | on request or when useful | Work test-first on an uncovered behavior change |
| `q-adversarial` | explicit | Run an independent adversarial review panel |
| `q-threat-model` | explicit | Create, refresh, or audit a threat model |
| `q-computer-use` | when device or browser work needs it | Collect running-app evidence |

Explicit skills are invoked as `/q-spec` in Claude Code, `$q-spec` in Codex, or `/skill:q-spec`
in pi. Ordinary coding requests do not enter a q process automatically.

## Core flow

- **Spec:** give a destination path, or choose one after the skill inspects project conventions.
  A spec may also be returned in the conversation.
- **Plan:** provide freeform specification text, a spec path, or a stated outcome. The plan may be
  returned in the conversation or saved where you ask.
- **Implement:** provide a general instruction, a pasted plan, or a plan path. Checks are selected
  for the actual change; no artifact or review gate is required by the suite.

Examples:

```text
/q-spec Define the offline search behavior. Save the spec at docs/design/offline-search.md.
/q-plan Plan from docs/design/offline-search.md.
/q-implement Implement docs/plans/offline-search.md.
/q-implement Fix the stale search results after reconnecting.
```

## Install

```sh
npx skills add nmquebb/skills#v2 -a claude-code codex pi
```

For the Claude Code plugin:

```text
/plugin marketplace add nmquebb/skills#v2
/plugin install q@q-skills
```

The `v2` channel carries this simplified workflow. See [distribution](docs/distribution.md) for
update and migration details. Skills work without configuration. If a project needs shared code,
test, or agent conventions, use `$q-workflow` to add only those settings to
`.agents/q/config.yaml`; see the [configuration reference](skills/q-workflow/references/config.md).

## Contributing

[AGENTS.md](AGENTS.md) has authoring and compatibility rules. Validate with:

```sh
node scripts/validate.mjs && node --test "tests/*.test.mjs"
```

MIT licensed.
