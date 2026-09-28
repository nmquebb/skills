# Local Tracker

Issues are Markdown files in `tracker.dir` (default `docs/issues`), committed with the repository.
Git history is the audit trail; the file is truth.

## File format

One file per issue, named `<id>-<slug>.md` with a zero-padded four-digit ID (`0007-export-csv.md`):

```markdown
---
id: 7
title: Export invoices as CSV
status: open
created: 2026-09-28
closed:
---

# Export invoices as CSV

<Original description. Never rewritten by triage or implementation.>

<!-- q-triage:v1:start -->
...
<!-- q-triage:v1:end -->

## Log

- 2026-09-28T14:03Z · triage · Proposal approved interactively.
```

`status` is `open` (untriaged), a [tracker status](tracker.md#statuses) in kebab-case (`proposed`,
`questions`, `ready`, `in-progress`, `in-review`, `blocked`), `done`, or `closed` (won't do). Keep
`id` and `created` immutable; the filename slug never changes after creation.

## Operations

| Operation | How |
| --- | --- |
| **resolve** | Match `id`, the zero-padded prefix, or the path; stop on zero or several matches |
| **read** | The whole file |
| **write-contract** | Replace the one block, or insert the first before `## Log`; re-read and compare |
| **set-status** | Edit `status` and append a log entry naming the transition, on the branch [Commits and branches](#commits-and-branches) names |
| **note** | Append one `## Log` entry: UTC timestamp, phase, one line of evidence or a link |
| **link** | Log the implementation branch in the final candidate commit, and reference the issue in the candidate body as `Issue: <path>`; never use a GitHub closing keyword, which would target an unrelated GitHub issue |
| **close** | `status: done` (or `closed` for won't-do), set `closed` to the date, and log the delivering branch or the reason; delivered work closes through its final candidate commit |
| **create** | Next ID is the highest existing ID plus one; write the file with `status: open` |

## Commits and branches

The parent's copy shows queue state (`open`, `proposed`, `questions`, `ready`, `blocked`, `done`,
`closed`); `in-progress` and `in-review` exist only on the issue branch.

- Triage edits and commits the issue file on a clean parent branch as `docs(issues): triage #<id>`;
  when the checkout is on another branch or holds unrelated changes, ask before switching.
- Implementation changes the issue file only on its branch: the first commit sets `in-progress`,
  and the final candidate commit sets `done`, fills `closed`, and logs the branch (manual-risk work
  logs that it awaits review). Merging lands the final status atomically; a candidate that never
  merges never changes the parent's copy.
- A discarded attempt sets `blocked` on the parent with one log entry (risk, failed repair, and
  suggested follow-up), committed and published like other parent changes.

Publish parent commits as the integration host allows (`integration.push` for `local`). Two edits
to one issue file are an ordinary merge conflict: keep both log entries and the later status. If
two branches created the same ID, renumber the later file after merge and log the change.
