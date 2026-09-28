---
name: q-workflow
description: "Set up, check, or migrate a repository's q skill-suite configuration (.agents/q/config.yaml), or explain the q delivery lifecycle and which phase comes next. Use when the user invokes q-workflow, asks to configure the q skills for a repository, or another q skill reports missing, invalid, or outdated q configuration."
license: MIT
---

# Q Workflow

The q suite is an opt-in delivery lifecycle plus standalone engineering skills:

| Lane | Skills |
| --- | --- |
| Full lifecycle | `q-spec` → `q-plan` → `q-reconcile` (Prepare) → `q-implement` → `q-reconcile` (Integrate) → `q-archive` |
| Lightweight issue | `q-triage` → `q-implement` |
| Support | `q-feedback` (capture and resume), `q-roadmap`, `q-improve-skills` |
| Standalone | `q-code-quality`, `q-tdd`, `q-adversarial`, `q-threat-model`, `q-computer-use` |

This skill owns the project configuration contract and the references the lifecycle skills share.
It writes only `.agents/q/` and, with approval, the `AGENTS.md` pointer block and tracker labels.

## Choose the mode

- **Setup:** no `.agents/q/config.yaml` exists, or the user asks to configure or reconfigure.
- **Check:** the user asks whether the configuration works, or a q skill reported a configuration
  problem. Read-only.
- **Migrate:** the configuration's `version` is older than this suite reads; see
  [versions](references/config.md#versions-and-migration).
- **Explain:** the user asks how the lifecycle works or what comes next. Answer from
  [lifecycle](references/lifecycle.md) and the active artifacts under `paths.work`, then name the
  owning skill and its invocation.

## Setup

1. Inspect before asking: `git remote -v`, the remote's default branch, `gh auth status` when a
   remote is on github.com, any existing `.agents/q/`, `AGENTS.md` and `CLAUDE.md`, the directories
   the [defaults](references/config.md#keys) name, package scripts, `Makefile` or `justfile`, and
   CI workflow commands.
2. Draft the configuration from [the template](templates/config.yaml): detected values first, then
   defaults, each marked detected or default.
3. Ask the material frontier together under [Decision Questions](references/decision-questions.md):
   tracker backend, integration host, parent branch when detection is ambiguous, roadmap backend,
   and the agent launcher when more than one is available. Never ask what detection settled.
4. Write `.agents/q/config.yaml` with `version: 1`, the settled values, and the template's comments
   for everything left at its default, requesting write approval where the host protects
   `.agents/` (see [config](references/config.md)).
5. Offer, as one approval: the [AGENTS.md pointer](references/config.md#agentsmd-pointer), and for
   the GitHub tracker, creation of missing status labels with the
   [default colors](references/backends/tracker-github.md#labels). Create nothing without it.
6. Run Check and report the effective configuration.

Commit the configuration only when the user asks; it is ordinary repository content.

## Check

Report, without editing anything:

- the `version` and whether this suite reads it; unknown keys, each once;
- the effective value of every setting and its source: `config`, `addendum`, `detected`, or
  `default`;
- one real read per configured backend: `gh repo view` and `gh label list` for GitHub tracker or
  integration, the issue directory for the local tracker, `gh project view <number> --owner
  <owner>` with `project` scope for a GitHub Project roadmap, and the launcher's agent or provider
  listing when it is not `native`;
- the project addenda under `.agents/q/` and the skill each extends; flag files that match no skill.

End with the smallest fix for each failure. Validate against
[the schema](references/config.schema.json) when a JSON Schema validator is available; otherwise
check keys and enumerations by reading. Either way, check the
[valid combinations](references/config.md#valid-combinations) against the effective host, including
an inferred one, which the schema cannot see. The schema rejects unknown keys so editors catch
typos, but at run time they are warnings: a newer suite may have added them.

## Migrate

Follow the matching section of [versions and migration](references/config.md#versions-and-migration):
show the planned edit, apply it after approval, and run Check. Never migrate addenda content; report
rules that reference renamed keys.

## Reference map

Lifecycle skills load these on demand:

| Need | Reference |
| --- | --- |
| Configuration keys, defaults, detection, addenda, precedence | [config](references/config.md) |
| Authority, phases, delivery policy, readiness, workspaces, integration, communication | [lifecycle](references/lifecycle.md) |
| Roles, routes, launchers, escalation | [orchestration](references/orchestration.md) |
| Questions and approvals | [decision questions](references/decision-questions.md) |
| Artifact surfaces, durable references, markers | [artifacts](references/artifacts.md) |
| Ledger and delivery-record metrics | [metrics](references/metrics.md) |
| Writing records and guidance | [documentation](references/documentation.md) |
| Tracker operations | [tracker](references/backends/tracker.md) |
| Integration operations | [integration](references/backends/integration.md) |
