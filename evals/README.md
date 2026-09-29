# Evals

Repeatable measurements of how agents behave with the q skills, run headlessly on every host the
suite supports. Use them to check a skill change before it ships, to tune skill text by
hillclimbing, and to choose models and effort for roles. `q-improve-skills` owns when an eval
counts as evidence and how to hillclimb ([evals](../skills/q-improve-skills/references/evals.md));
this document owns the harness.

Every run spends real model usage, so nothing here runs in CI; `tests/eval.test.mjs` covers the
harness itself.

## Suites

| Suite | Question | Graders |
| --- | --- | --- |
| [`review-effort`](review-effort/) | Does reviewer effort or model buy defect detection in the final review? Ten small deliveries, eight with planted defects and two clean controls, reviewed under the `q-implement` final-review contract | Verdict JSON and status, a read-only check, one judge claim per planted defect |
| [`skill-triggers`](skill-triggers/) | Do the model-invocable skills load on realistic first messages and stay out of near misses? | Skill-load events |

The cases are synthetic stand-ins for real work, anchored to the defect and request classes the
suite meets. Keep production-derived cases, which carry a project's code and history, in a private
suite outside this repository and run it by path.

## Run

```sh
node scripts/eval.mjs run review-effort --reps 1 --label pilot       # the suite's default arms
node scripts/eval.mjs run review-effort --arms opus-low,sol-medium --yes
node scripts/eval.mjs report ~/.cache/q-evals/review-effort/<run>
node scripts/eval.mjs split review-effort                            # once, before hillclimbing
node scripts/eval.mjs run review-effort --split train --label round-1 --yes
node scripts/eval.mjs compare <baseline-run> <round-run>
node scripts/eval.mjs run /path/to/private-suite                     # a suite outside evals/
```

A run over 30 trials needs `--yes`; `--dry-run` lists the trials. `--skills-rev <rev>` tests a
committed revision of `skills/` instead of the working tree, and `--resume <run-dir>` finishes an
interrupted run.

Runs land in `~/.cache/q-evals/<suite>/<timestamp>-<label>/` (move them with `--out` or
`Q_EVALS_HOME`): `run.json` (arms, skills revision, host versions), `results.jsonl` (one line per
trial), `report.md`, and `trials/<case>__<arm>__r<rep>/` with the prompt, the host's raw stream,
normalized events, the final message, the workspace's Git state, and every judge exchange.

## How a trial runs

1. A fresh Git repository in a temporary directory gets the selected skills copied into
   `.agents/skills/` and linked from `.claude/skills/`, the way the skills CLI installs them, plus
   the suite's `.agents/q/config.yaml`, in one commit. The case's `setup` command then builds the
   fixture.
2. The arm's CLI runs the prompt there with a minimal environment: the parent session's variables
   (an inherited effort among them), shell startup files, and telemetry exporters stay out, and
   Git uses a throwaway identity with an empty global config. Effort is pinned on every host.
   - Claude Code: `--effort` plus `CLAUDE_CODE_EFFORT_LEVEL`, which outranks every settings file;
     `--setting-sources project,local --strict-mcp-config` keeps the user's settings, hooks,
     skills, and MCP servers out while the login still works. A run answered by another model than
     the arm's fails as `model-mismatch`.
   - Codex: `-c model_reasoning_effort=...` with `--ephemeral --ignore-user-config`. Codex still
     lists skills installed in the user's home (`~/.agents/skills`, `~/.codex/skills`), so a global
     skill can load in Codex arms, and its stream names no model, so the route stays unverified.
3. Graders read the final message, the normalized events, and the finished workspace. A trial's
   judge claims go in one batch to the suite's judge for the arm's host, which must be another
   model family; a judge answer that cannot be parsed is asked once more, then left ungraded.
4. The workspace is deleted unless `--keep`.

The report gives each arm's pass rate and mean score as means over cases, with 95% bootstrap
intervals resampled over cases, then grader and case pass rates, usage, and warnings: no headroom
(an arm at 95% or more), noise wider than the suite's `minEffect`, more effort doing worse on the
same model, infrastructure failures, and judge disagreement. `compare` pairs two runs case by case
and, when the suite has a `split.json`, applies the keep-or-revert rule to the train and test
deltas.

## Suite format

`suite.json`:

| Key | Meaning |
| --- | --- |
| `arms` | Named arms: `{ host, model, effort }` |
| `defaultArms` | Arms a run uses without `--arms` |
| `judges` | Judge per host under test: `{ host, model, effort }` from another family |
| `reps`, `timeoutSeconds`, `maxTurns` | Defaults per trial (`maxTurns` applies to Claude Code) |
| `minEffect` | The smallest pass-rate change worth acting on |
| `skills` | `all` (default), `none`, or a list of skill folders to install |
| `config` | File copied to `.agents/q/config.yaml` |
| `setup` | Shell command that builds the fixture, with `CASE_DIR`, `SUITE_DIR`, and `SKILLS_DIR` set |
| `sandbox` | Codex sandbox for the agent (default `workspace-write`) |
| `stop` | End runs early: `onSkill` (true or a skill-name pattern) and `afterTools` |
| `graders` | Graders added to every case |
| `judgeVotes` | Judge calls per trial, majority wins (default 1) |

Cases are directories `cases/<id>/case.json`, entries of a `cases.json` array, or both. A case
has `tags` (the first stratifies the split), `prompt` or `promptFile` (relative to the case), and
`graders`, and may override `setup`, `config`, `skills`, `stop` (null runs to the end), `sandbox`,
`maxTurns`, and `timeoutSeconds`. `judgeContext` is a shell command whose output, taken from the
finished workspace, the judge sees beside the final message. Prompts may include files with
`{{case:path}}`, `{{suite:path}}`, and `{{skills:path}}`, the last from the skills under test.

| Grader | Passes when |
| --- | --- |
| `final` | `pattern` (with `flags`) is found in the final message, or absent with `match: absent` |
| `json` | The final message holds a JSON object with the `required` keys, `enum` values, and `nonEmpty` arrays |
| `events` | Between `min` (default 1) and `max` normalized events of `kind` match `pattern` |
| `check` | The shell command `run` exits 0 in the finished workspace |
| `judge` | The judge finds `claim` true of the final message |

Every grader has a `name` and an optional `weight`. A trial passes when every grader passes; its
score is the weighted share that passed.

## Add a host

Add one entry to `scripts/eval/hosts.mjs`: `bin`, `family`, `command()` for a headless run with a
pinned model and effort, and `start()`, `line()`, and `finish()`, which fold the CLI's JSON stream
into normalized events (`message`, `skill`, `command`, `read`, `write`, `search`, `agent`, `tool`),
the final message, the session ID, observed models, and usage (`input` including cached tokens,
`cachedInput`, `cacheWrite`, `output`, `reasoning`, `costUsd`). A skill counts as loaded when the
host's skill tool runs or the agent reads a `SKILL.md`. Suites then name the host in arms and
judges; nothing else changes.

## Limits

- Graders sit on disk outside the workspace, so an agent that searched the whole filesystem could
  find them.
- A run stopped early records no usage.
- Judges see the final message, not the workspace, unless the case sets `judgeContext`.
- Multi-turn cases are not supported yet; a case is one first message.
