# Tracker Operations

Skills name these operations; the backend for `tracker.backend` says exactly how to perform them:
[github](tracker-github.md), [local](tracker-local.md), or a project's [custom](tracker-custom.md)
adapter. Load only the configured backend.

| Operation | Contract |
| --- | --- |
| **resolve** | Turn a number, ID, URL, or path into exactly one issue in one repository; stop on zero or several matches |
| **read** | Title, description, state, status, comments or log, and linked candidates |
| **write-contract** | Replace the one `q-triage:v1` block, or append the first after the original description; preserve everything else; re-read and compare |
| **set-status** | Move to one status below, removing the previous status marker |
| **note** | Append one comment or log entry with evidence; edit a keyed note in place instead of adding another |
| **link** | Record the candidate that delivers the issue so merging it closes the issue |
| **close** | Mark done or closed with a pointer to the delivering merge or the reason |
| **create** | New issue, only on explicit user request or a workflow that grants it |

## Statuses

| Status | Meaning |
| --- | --- |
| `proposed` | A triage proposal awaits approval |
| `questions` | Triage needs answers before approval |
| `ready` | An approved `q-triage:v1` contract exists; ready for implementation |
| `inProgress` | Implementation claimed the issue |
| `inReview` | A ready candidate awaits user review |
| `blocked` | Work stopped; the latest note names the cause and resume condition |

An open issue with no status is untriaged. Status mirrors queue state; it never grants mutation
authority.

## The triage block

Every backend stores the approved contract as one block delimited by exact markers:

```markdown
<!-- q-triage:v1:start -->
...
<!-- q-triage:v1:end -->
```

Zero blocks means first triage; one block may be revised after another approval. Never edit
multiple or malformed blocks automatically.
