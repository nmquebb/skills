# q Skills — Agent Guide

This repository is the q skill suite: Agent Skills for Claude Code, Codex, and pi, distributed
through the `skills` CLI and a Claude Code plugin marketplace. [README](README.md) covers
installation; [distribution](docs/distribution.md) owns channels, releases, and the compatibility
contract.

## Layout

| Path | Owns |
| --- | --- |
| `skills/<name>/SKILL.md` | One skill; `name` equals the folder name and starts with `q-` |
| `skills/<name>/references/` | Detail loaded on demand, linked from SKILL.md with when to read it |
| `skills/<name>/scripts/` | Executables the skill runs |
| `skills/<name>/agents/openai.yaml` | Codex interface metadata and invocation policy |
| `skills/q-workflow/references/` | Shared lifecycle contract: config, lifecycle, orchestration, backends, questions, artifacts, metrics, documentation |
| `.claude-plugin/` | Plugin and marketplace manifests, with no `version` so users track commits |
| `scripts/validate.mjs` | Suite validator |
| `tests/` | Tests for suite scripts |
| `docs/` | Maintainer documentation: distribution, skill history |

## Compatibility contract

These are public API. Within a major channel, change them only additively:

- skill names and whether a skill is explicit-only;
- `.agents/q/config.yaml` keys, defaults, and meanings, and addendum file names;
- artifact formats written into consumer repositories and trackers: spec, plan, ledger, delivery
  record, local issue and roadmap files, and every `q-*:vN` marker;
- authority: a change never lets a skill mutate something it previously left alone unless new
  configuration opts in.

Readers accept every marker and artifact version the suite has written; writers write the newest.
Wording, procedure refinements, new optional keys, new skills, and new references ship
continuously. `scripts/check-compat.mjs` enforces the contract in CI; a change to a guarded section
needs a `Compat-Reviewed: <reason>` trailer, on its latest commit or a later one, once you have
confirmed it is compatible. When a change cannot be made compatible, stop and follow the major-release procedure
in [distribution](docs/distribution.md#breaking-changes).

## Writing skills

- **Frontmatter:** `name`, a double-quoted `description`, `license: MIT`, and for explicit-only
  skills `disable-model-invocation: true`. The description is at most 1024 characters with no angle
  brackets and says what the skill does and when to use it; keep it short, because Codex caps the
  whole skill list. pi skips a skill whose frontmatter is not strict YAML.
- **Invocation policy:** explicit-only skills are hidden from the model on every host:
  `disable-model-invocation: true` (Claude Code, pi) and `policy.allow_implicit_invocation: false`
  in `agents/openai.yaml` (Codex). Users invoke them as `/q-x` (Claude Code), `$q-x` (Codex), or
  `/skill:q-x` (pi). Hand-offs between skills link the target's SKILL.md by relative path, which
  works whatever its invocation setting.
- **Size:** SKILL.md at most 500 lines; keep it to procedure and decisions, with one level of
  references for reusable detail.
- **Paths:** link files relative to the linking file (`references/x.md`, `../q-tdd/SKILL.md`). Name
  scripts as `<skill-dir>/scripts/x.sh`, where `<skill-dir>` is the directory containing the
  SKILL.md. Never use host variables such as `${CLAUDE_SKILL_DIR}` or install-location paths such
  as `.agents/skills/...`.
- **Hosts:** write host-neutral instructions ("the host's question tool", "a fresh read-only agent
  per orchestration"). Host-specific tool names belong in
  [the native launcher](skills/q-workflow/references/launchers/native.md) or a clearly labeled
  host note. Every step that needs a capability some host lacks (subagents, a question tool, web
  access) states the fallback.
- **Scripts:** POSIX `sh`/`bash`, or Node 20+ ESM with no dependencies. No network access, no
  installs, no Bun-only APIs. Scripts locate their own files from their own path and write only to
  the working repository or a temporary directory, never into the skill folder. A
  platform-specific script says so and exits with a clear message elsewhere.
- **No nested skills:** never ship a file named `SKILL.md` below a skill folder; Codex registers
  it as another skill.
- **Project specifics never enter the suite.** Read them from `.agents/q/config.yaml`, project
  addenda in `.agents/q/`, and project guidance, per
  [config](skills/q-workflow/references/config.md).
- **Standalone skills** (`q-code-quality`, `q-tdd`, `q-adversarial`, `q-threat-model`,
  `q-computer-use`) work without the rest of the suite. They read config and their addendum
  directly, and treat links into other skills as optional enhancements, except that `q-tdd` and
  `q-code-quality` depend on each other.
- **Style:** imperative, dense, decisive. Defaults first, then exceptions a reader could meet. No
  generic advice the model already follows. Wrap Markdown near 100 columns.

## Validate

```sh
node scripts/validate.mjs                # structure, frontmatter, links, leaks, manifests (CI)
node --test "tests/*.test.mjs"           # suite script tests (CI)
node scripts/check-compat.mjs origin/v1  # public-API compatibility with the channel (CI)
node scripts/check-hosts.mjs             # before releasing host-visible changes; needs network
```

`check-hosts` installs this checkout with the `skills` CLI into a throwaway repository, resolves
every relative link through the installed layout, and asks Claude Code (`claude plugin validate` and
an install into a throwaway config), Codex (`codex debug prompt-input`), and pi (its own skill
loader, via `PI_PACKAGE_DIR` or a global install) what they load; it skips hosts that are not
installed. The git-hosted plugin cache can only be exercised after publishing: add
`nmquebb/skills#v1` as a marketplace in a throwaway `CLAUDE_CONFIG_DIR`. `claude plugin validate` warns that the plugin has no version; that is deliberate (see
[distribution](docs/distribution.md#channels)).

## Record changes

- `CHANGELOG.md`: one line per consumer-visible change under today's date in the current channel.
- `docs/skill-history.md`: provenance for evidence-driven changes, as terse labeled lines (source,
  problem, decision, affected skills, validation, next evidence).
