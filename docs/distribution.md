# Distribution and Compatibility

How the q suite reaches projects, how improvements ship without breaking them, and what counts as
breaking.

## Channels

| Channel | Git ref | For | Receives |
| --- | --- | --- | --- |
| `v1` | branch `v1` | Every project | Every compatible improvement, continuously |
| `main` | branch `main` | Dogfooding and early adopters | Everything as it lands, including the start of a future major |

A channel is a branch named for its major version. CI fast-forwards `v1` to `main` after every push
that passes validation, so a compatible improvement reaches `v1` consumers within minutes. When a
breaking change is unavoidable, `v1` freezes and `v2` begins; `v1` consumers are never moved onto
it.

There are no version numbers to bump. Plugin manifests deliberately omit `version`, so Claude Code
tracks commits, and the `skills` CLI tracks the channel branch named in each consumer's
`skills-lock.json`. `claude plugin validate` warns about the missing version; that warning is
expected.

## Install

**`skills` CLI** (Claude Code, Codex, pi, and other agents). Project installs copy the skills into
`.agents/skills/`, which Codex and pi read, and link them into `.claude/skills/` for Claude Code:

```sh
npx skills add nmquebb/skills#v1 -a claude-code codex pi
npx skills add nmquebb/skills#v1 -a claude-code codex pi --skill q-code-quality q-tdd   # a subset
```

Commit `.agents/skills/`, `.claude/skills/`, and `skills-lock.json`; updates then arrive as reviewable
diffs. pi loads project skills only after the project is trusted.

**Claude Code plugin marketplace:**

```text
/plugin marketplace add nmquebb/skills#v1
/plugin install q@q-skills
```

Then enable updates: `/plugin` → Marketplaces → `q-skills` → Enable auto-update. Plugin skills are
namespaced (`/q:q-spec`); the bare `/q-spec` also works when no other skill uses that name.

Install the whole suite together: lifecycle skills link to each other by relative path. The
standalone skills (`q-code-quality` with `q-tdd`, `q-adversarial`, `q-threat-model`,
`q-computer-use`) also work alone.

## Update

| Install | Update |
| --- | --- |
| `skills` CLI | Rerun the install command with `-y` (`npx skills add nmquebb/skills#v1 -a claude-code codex pi -y`, plus your `--skill` list for a subset), then review and commit the diff. It refreshes installed skills and adds skills new to the channel. `npx skills update` only refreshes skills already in `skills-lock.json`; neither has a dry run. |
| Plugin with auto-update | Automatic at session start, including new skills |
| Plugin without auto-update | `/plugin marketplace update q-skills` |

To freeze a project on an exact revision, install `nmquebb/skills#<full-commit-sha>`, or keep the
committed copies and update deliberately.

## Release a compatible improvement

1. Change the skills on `main`, directly or through a pull request, following
   [AGENTS.md](../AGENTS.md).
2. Add one line per consumer-visible change to `CHANGELOG.md` under today's date (mark a new skill
   `new skill`, since `skills` CLI users receive it only by rerunning the install command), and a
   provenance entry to [skill history](skill-history.md) for evidence-driven changes.
   `q-improve-skills` does both.
3. Push. CI validates, runs `scripts/check-compat.mjs` against `origin/v1`, and fast-forwards `v1`.
   That is the release.

Nothing else is required: no version bump, tag, or release note.

## Compatibility contract

[AGENTS.md](../AGENTS.md#compatibility-contract) defines the public API: skill names and invocation
policy, project configuration, artifact formats and markers, and default authority. Everything
else ships continuously.

CI enforces it with `scripts/check-compat.mjs` against the channel branch, and a failed check blocks
promotion:

- **Always breaking:** a removed skill, a flipped invocation policy, a removed configuration key,
  enumeration value, or version, a changed static default (`default` in the configuration schema),
  a dropped marker, or a removed artifact-format heading or field.
- **Needs a recorded review:** a reworded conditional default (`x-default`), or any change to the
  guarded sections that carry authority, precedence, detection, and review independence (listed in
  the script). After confirming the change alters no default or authority, add a
  `Compat-Reviewed: <reason>` trailer to the latest commit that makes it, or a later one; an older
  trailer never covers a later change. Rewrapping alone never needs one.

Prefer these compatible alternatives to a break:

| Instead of | Ship |
| --- | --- |
| Renaming or removing a skill | A new skill, and the old one reduced to a stub that says which skill replaced it; delete the stub only in the next major |
| Changing a configuration key's meaning | A new optional key whose default preserves current behavior |
| Changing an artifact format or marker | A reader that accepts both the old and new forms, and a writer that writes the new one |
| Granting a skill new default authority | A configuration opt-in that defaults to the current behavior |

## Breaking changes

When no compatible alternative exists:

1. Put the break on `main` in one commit that also:
   - sets `CHANNEL: v2` in `.github/workflows/ci.yml`;
   - adds a `## v2` section to `CHANGELOG.md` with the migration steps;
   - bumps the configuration `version` with a migration section in `q-workflow`'s `config.md`,
     when configuration changed.
2. Push. `check-compat` has no `v2` to compare with yet, so CI creates `v2`; `v1` stays frozen at
   its last compatible commit.
3. Consumers opt in: `npx skills add nmquebb/skills#v2`, or remove the `q-skills` marketplace and
   add `nmquebb/skills#v2`.
4. A critical fix for `v1` after the split is cherry-picked onto `v1` and pushed; CI validates it.

## Maintainer setup

- Keep the repository public so others can install it. skills.sh lists it automatically once
  people install it with the `skills` CLI.
- Protect `v1` (and later channels) against force-pushes and deletion with a branch ruleset. Do not
  require pull requests on channel branches, so CI's fast-forward push still works.
- To dogfood unreleased work in your own projects, install from `#main`, or point `Q_SKILLS_SOURCE`
  at your checkout for `q-improve-skills`.
