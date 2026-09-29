For questions about code, use the qs MCP tools (`code_search`, `code_symbols`, `code_deps`). `rg`
is fine for a quick literal search.

# q Skills — Agent Guide

This repository is the q skill suite for Claude Code, Codex, and pi. The core is a lightweight,
opt-in Spec → Plan → Implement path; each skill also works as a separate entry point. [README](README.md)
covers installation and [distribution](docs/distribution.md) owns releases.

## Layout

| Path | Owns |
| --- | --- |
| `skills/<name>/SKILL.md` | One skill; `name` equals its `q-` folder name |
| `skills/<name>/references/` | Detail loaded only when relevant |
| `skills/<name>/scripts/` | Executables the skill runs |
| `skills/<name>/agents/openai.yaml` | Codex interface metadata and invocation policy |
| `skills/q-workflow/references/` | Optional project configuration and agent routing |
| `.claude-plugin/` | Plugin and marketplace manifests, with no version |
| `scripts/validate.mjs` | Suite validator |
| `scripts/eval.mjs`, `scripts/eval/`, `evals/` | Optional host eval harness and suites |
| `tests/` | Tests for suite scripts |
| `docs/` | Distribution and skill history |

## Compatibility contract

Within a major channel, change these public interfaces only additively: skill names and invocation
policy; `.agents/q/config.yaml` keys, defaults, and meanings; artifact formats and any `q-*:vN`
markers a skill writes; and authority. Readers accept all forms the channel has written. The
checker, `scripts/check-compat.mjs`, enforces mechanical parts. A change to guarded wording that
preserves authority needs a `Compat-Reviewed: <reason>` trailer on the latest relevant commit.
A breaking change starts a new major channel per [distribution](docs/distribution.md#breaking-changes).

The v2 core skills impose no default spec or plan location, ledger, tracker, branch, review gate,
phase approval, or next-phase routing. Do not reintroduce one through a reference, template,
example, or setup path. A user path or project convention may supply a location for a particular
request. Implementation accepts a direct instruction or a plan; planning accepts freeform text or
a file.

## Writing skills

- **Frontmatter:** `name`, a double-quoted `description`, `license: MIT`, and for explicit-only
  skills `disable-model-invocation: true`. Keep descriptions short and discriminating. pi needs
  strict YAML.
- **Invocation policy:** explicit-only skills also set `policy.allow_implicit_invocation: false`
  in `agents/openai.yaml`. Users invoke them as `/q-x` (Claude Code), `$q-x` (Codex), or
  `/skill:q-x` (pi).
- **Size:** keep `SKILL.md` at most 500 lines and as short as the task permits. Put reusable detail
  in one level of references, linked with when to read it.
- **Paths:** link relative to the linking file. Name scripts as `<skill-dir>/scripts/x.sh`, where
  `<skill-dir>` contains the SKILL.md. Do not use host variables or installed skill paths.
- **Hosts:** write host-neutral instructions. Host-specific tool names belong in the native
  launcher or a labeled host note. State a fallback when a step needs a capability a host lacks.
- **Scripts:** POSIX shell or Node 20+ ESM, no dependencies, network, or installs. Scripts locate
  their own files and write only to a working repository or temporary directory.
- **No nested skills:** no `SKILL.md` below a skill folder.
- **Project specifics:** read them from `.agents/q/config.yaml`, addenda, and project guidance.
  Do not put one project's rules in this suite.
- **Standalone utilities:** `q-code-quality`, `q-tdd`, `q-adversarial`, `q-threat-model`, and
  `q-computer-use` work without the core; `q-tdd` and `q-code-quality` link to each other.
- **Style:** imperative, dense, decisive. Defaults first, exceptions second. Avoid generic advice
  and process requirements without a concrete benefit. Wrap Markdown near 100 columns.

## Validate

```sh
node scripts/validate.mjs
node --test "tests/*.test.mjs"
node scripts/check-compat.mjs origin/v2
node scripts/check-hosts.mjs             # before releasing host-visible changes; needs network
node scripts/eval.mjs run <suite>        # optional; spends model usage, never in CI
```

`check-hosts` tests a throwaway installation across available hosts; the plugin's missing version
warning is deliberate. `eval.mjs` runs cases against host CLIs in fresh workspaces; see
[evals](evals/README.md).

## Record changes

- `CHANGELOG.md`: one line per consumer-visible change under today's date in the current channel.
- `docs/skill-history.md`: terse provenance for evidence-driven changes, including source, problem,
  decision, affected skills, validation, and next evidence.
