# Q Project Configuration

One committed file tells every q skill how this repository works: `.agents/q/config.yaml`. Skills
read it; `q-workflow` writes it, and `q-improve-skills` edits it or an addendum for an approved
project change. Some sandboxes protect `.agents/` from agent writes (Codex's default does); request
the host's approval for such a write rather than writing elsewhere. Every key is optional except
`version`; an omitted key takes the detected value or default below.

## Read the configuration

Read `.agents/q/config.yaml` from the repository root once per session, before the first step that
depends on it, and reuse the result. Then read `.agents/q/<skill>.md` for the running skill, where
`<skill>` is its name without `q-` (for example `.agents/q/implement.md`), and
`.agents/q/workflow.md` for every lifecycle phase. These optional project addenda extend the suite
for this repository.

When the file is absent, continue with detected values and defaults, and state them once in one
line: `q config: none; inferred tracker=github integration=github parent=origin/main`. Suggest
`q-workflow` setup when the inference was ambiguous or a remote write is next.

When `version` is newer than this suite supports, stop and ask the user to update the q skills.
When it is older, follow [Versions and migration](#versions-and-migration). Ignore unknown keys,
naming each once as a likely typo or a key from a newer suite.

## Precedence

1. Explicit user direction in the session.
2. Project addenda under `.agents/q/`.
3. `.agents/q/config.yaml`.
4. Project guidance: the nearest `AGENTS.md` or `CLAUDE.md`, and the documents `conventions`
   names.
5. Detected values.
6. Suite defaults, including baselines such as `q-code-quality`'s code style.

Addenda may add rules, change defaults, and narrow authority. They never grant authority the suite
withholds: force-push, history rewrite, administrative bypass of host rules, deleting unproved
resources, or destructive data operations need explicit user direction for the specific action.

## Keys

### Tracker: where lightweight issues live

| Key | Default | Meaning |
| --- | --- | --- |
| `tracker.backend` | `github` when `origin` is on github.com and `gh auth status` succeeds; otherwise `local` | `github`, `local`, or `custom` |
| `tracker.repo` | `owner/name` of `git.remote` | GitHub repository for issues |
| `tracker.labels.<status>` | [GitHub labels](backends/tracker-github.md#labels) | Label for `proposed`, `questions`, `ready`, `inProgress`, `inReview`, `blocked` |
| `tracker.dir` | `docs/issues` | Local issue directory |
| `tracker.adapter` | none; required for `custom` | Project document implementing the [custom tracker contract](backends/tracker-custom.md) |

### Integration: how finished work lands

| Key | Default | Meaning |
| --- | --- | --- |
| `integration.host` | `github` when `origin` is on github.com and `gh auth status` succeeds; otherwise `local` | `github`: one ready pull request per delivery; `local`: merge in the control checkout, no pull request |
| `integration.mergeMethod` | `merge` | `merge` or `squash`; `rebase` with `github` only. See the host backend for the proof each needs |
| `integration.push` | `true` for `github`, `false` for `local` | For `local`, whether Integrate and Archive may push the parent branch after committing to it |

### Git and workspaces

| Key | Default | Meaning |
| --- | --- | --- |
| `git.remote` | `origin` | Parent remote; `none` for a repository without one |
| `git.parentBranch` | The remote's default branch (`git symbolic-ref refs/remotes/<remote>/HEAD`), else the current branch | Default parent for new work |
| `git.workspace` | `worktree` | `worktree`: one isolated plain-Git worktree per delivery; `branch`: the implementation branch is checked out in the control checkout |
| `git.worktreeRoot` | `~/.q/worktrees/{repo}` | Worktree parent; `{repo}` is the repository directory name |
| `branches.lifecycle` | `{type}/{slug}` | Full-lifecycle implementation branch |
| `branches.issue` | `{type}/GH-{id}-{slug}` for `github`; `{type}/issue-{id}-{slug}` otherwise | Issue-lane branch |

`{type}` is `feature`, `fix`, `chore`, or `release`; `{slug}` is lowercase kebab-case.

### Paths

| Key | Default | Meaning |
| --- | --- | --- |
| `paths.work` | `docs/work-in-progress` | Active delivery directories holding `spec.md`, `plan.md`, and `ledger.md` |
| `paths.deliveries` | `docs/deliveries` | Archived delivery records |
| `paths.decisions` | `docs/decisions` | Architecture decision records |
| `paths.threatModel` | `docs/threat-model.md` | Canonical threat model |
| `paths.feedback` | `docs/workflow/pending-feedback.md` | Suite feedback awaiting `q-improve-skills` |

### Roadmap

| Key | Default | Meaning |
| --- | --- | --- |
| `roadmap.backend` | `none` | `none`, `local`, or `github-project` |
| `roadmap.file` | `docs/roadmap.md` | Local roadmap |
| `roadmap.owner` | none | GitHub Project owner login (user or organization) |
| `roadmap.number` | none | GitHub Project number |

With `none`, lifecycle skills skip every roadmap step and `q-roadmap` reports that none is
configured.

### Conventions: project guidance that outranks suite baselines

| Key | Default | Meaning |
| --- | --- | --- |
| `conventions.codeStyle` | `[]` | Project code-style guides |
| `conventions.testing` | `[]` | Project testing guides: test kinds, commands, artifacts |
| `conventions.architecture` | `[]` | Ownership, boundaries, persistence, configuration |
| `conventions.baseline` | `true` | Also apply `q-code-quality`'s baseline guides where project guidance is silent; `false` when the project guides are complete. The baseline's re-grounding protocol and Review test apply either way |

Skills also follow the nearest `AGENTS.md` routing for task-specific guidance the table omits.

### Commands

| Key | Meaning |
| --- | --- |
| `commands.install` | Prepare a fresh worktree (for example `pnpm install --frozen-lockfile`) |
| `commands.format` | Format task-owned files |
| `commands.formatCheck` | Check formatting |
| `commands.lint` | Lint |
| `commands.typecheck` | Type-check |
| `commands.test` | Fast test suite |
| `commands.build` | Build, when acceptance needs it |

An omitted command is discovered from `AGENTS.md`, package scripts, `Makefile`/`justfile`, then CI
workflow steps; a command that cannot be discovered is a disclosed gap, never a guess.

### Risk, delivery checks, agents, archive

| Key | Default | Meaning |
| --- | --- | --- |
| `risk.boundaries` | `[]` | Extra `manual-risk` boundaries, added to [the defaults](lifecycle.md#delivery-policy) |
| `checks` | `[]` | [Delivery checks](#delivery-checks) |
| `agents.launcher` | `native` | `native` or `paseo`; see [orchestration](orchestration.md) |
| `agents.routes.<role>` | none | Route per role; see [orchestration](orchestration.md#roles) |
| `archive.trigger` | `after-merge` | `after-merge`: Reconcile Integrate continues into Archive; `automation`: an external job runs `q-archive` after merges |
| `archive.publish` | `direct` for `github`; `local` for `local` | `direct`: push the archive commit to the parent; `pull-request`: open a documentation-only pull request (`github` only); `local`: commit on the local parent, pushing only as `integration.push` allows (`local` only) |

## Valid combinations

Some settings depend on the integration host. Check them against the effective host, including an
inferred one; the schema can check only an explicit host.

| Host | `integration.mergeMethod` | `archive.publish` |
| --- | --- | --- |
| `github` | `merge`, `squash`, `rebase` | `direct`, `pull-request` |
| `local` | `merge`, `squash` | `local` |

A skill that meets an invalid pair stops before writing anything and names `q-workflow` Check.

## Delivery checks

A delivery check is a project rule every delivery must answer, such as legal pages that must change
with data collection:

```yaml
checks:
  - ask: Does this change collected personal data, processors, device permissions, or retention?
    ifYes: Update the privacy policy page and its "Last updated" date in the same delivery.
```

Spec and Triage include every check in the decision frontier unless repository evidence settles it,
and record the answer. Plan and the triage contract name each resulting change. Readiness requires
each `ifYes` change when the answer was yes.

## Defaults and detection

Detect before asking; record what was detected.

- **GitHub:** `git remote get-url <remote>` names github.com, and `gh auth status` succeeds.
  Otherwise the backend and host default to `local`. Never infer Linear, Jira, or another tracker;
  those use `custom`.
- **Parent branch:** `git symbolic-ref --short refs/remotes/<remote>/HEAD`, without the remote
  prefix. Without a remote, the current branch.
- **Commands:** see [Commands](#commands).
- **Launcher:** `native`, unless the configuration names another.

Reading, planning, and writing local files may proceed on inferred values. The first remote write
under an inferred configuration (creating or editing an issue, applying a label, pushing, opening
a pull request, editing a Project) needs either a configuration file or one explicit user
confirmation of the inferred backend in this session.

## Versions and migration

This suite reads configuration `version: 1`.

- Additive changes (new optional keys whose defaults preserve current behavior) never change the
  version.
- A key's meaning never changes within a version. A rename or meaning change creates a new version
  with a migration section here and one release of support for the previous version.
- A configuration newer than the suite: stop and ask the user to update the q skills.
- A configuration older than the suite: continue only when this section says the previous version is
  still readable, using its documented mapping; otherwise stop and name `q-workflow` migrate.

No migrations exist yet.

## AGENTS.md pointer

With approval, `q-workflow` setup adds this block to the root `AGENTS.md` (or `CLAUDE.md` when that
is the only instruction file) so sessions that load no skill know the workflow exists:

```markdown
<!-- q:begin -->
This repository uses the q skill suite. Its lifecycle (`q-spec` → `q-plan` → `q-reconcile` →
`q-implement` → `q-archive`) and `q-triage` are opt-in: use them only when invoked. Configuration
lives in `.agents/q/config.yaml`; project addenda in `.agents/q/`.
<!-- q:end -->
```

Replace an existing block between the markers; never duplicate it.
