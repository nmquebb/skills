# Distribution and compatibility

## Channels

| Channel | Git ref | Status |
| --- | --- | --- |
| `v1` | branch `v1` | Frozen legacy lifecycle; receives only targeted critical fixes |
| `v2` | branch `v2` | Current lightweight spec, plan, and implementation suite |
| `main` | branch `main` | Development; passing pushes promote to `v2` |

CI validates a push to `main` and fast-forwards `v2` after it passes. `v1` consumers stay on their
channel until they choose to migrate. Plugin manifests omit `version` so installations track
commits on their selected channel.

## Install and update

```sh
npx skills add nmquebb/skills#v2 -a claude-code codex pi
npx skills add nmquebb/skills#v2 -a claude-code codex pi --skill q-spec q-plan q-implement
```

Commit `.agents/skills/`, `.claude/skills/`, and `skills-lock.json` to review updates. Re-run the
same install command with `-y` to update and add channel skills. `npx skills update` refreshes only
skills already locked; neither command has a dry run. A full commit SHA pins an exact revision.

For the Claude Code plugin:

```text
/plugin marketplace add nmquebb/skills#v2
/plugin install q@q-skills
```

Enable marketplace auto-update in `/plugin` if desired. To change an existing v1 marketplace,
remove it and add `nmquebb/skills#v2`. `claude plugin validate` may warn that the plugin has no
version; this is intentional.

A repository-root `.ignore` containing `/.agents/skills/q-*/` hides installed skills from code
search tools that index hidden directories, while hosts still load them.

## Migrate from v1

The v2 installation removes `q-triage`, `q-roadmap`, `q-feedback`, `q-improve-skills`,
`q-reconcile`, and `q-archive`. Remove their installed folders and stale links when updating a
project; check the resulting `skills-lock.json`. Existing specs, plans, issues, ledgers, and
archive records remain ordinary project documents. The new skills read a document wherever the
user points them and never migrate or delete those artifacts automatically.

V1 `.agents/q/config.yaml` is not a v2 configuration. Keep the original for historical reference
if needed; for active v2 settings, write `version: 2` and retain only applicable `conventions`,
`commands`, `paths.threatModel`, and `agents` keys. See [config](../skills/q-workflow/references/config.md).
Remove v1 workflow pointer text in project guidance if it routes work through the old lifecycle.

## Compatibility contract

[AGENTS.md](../AGENTS.md#compatibility-contract) defines the v2 public API. CI runs
`scripts/check-compat.mjs origin/v2` before promotion. A removed skill, invocation change,
removed config key or value, changed default, or removed written format or marker is breaking.
Changes to guarded authority, precedence, or routing wording need a `Compat-Reviewed: <reason>`
trailer only after confirming they are compatible. Rewrapping alone needs none.

## Release a compatible change

1. Validate and test on `main` following [AGENTS.md](../AGENTS.md).
2. Add consumer-visible changes to [CHANGELOG.md](../CHANGELOG.md). Record evidence-driven changes
   in [skill history](skill-history.md).
3. Push. CI validates and promotes `main` to `v2`.

## Breaking changes

When compatibility is impossible, change `CHANNEL` in `.github/workflows/ci.yml` to the next major
and add a changelog section with migration steps in the same commit. If configuration changes,
change its version and document migration. On push, CI creates the new channel branch; the old
channel stays frozen. Consumers opt in by installing from the new branch. Critical fixes to an old
channel can be cherry-picked to it.

Protect channel branches against force-push and deletion. Do not require pull requests on them,
so CI can fast-forward the current channel.
