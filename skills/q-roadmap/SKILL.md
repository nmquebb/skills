---
name: q-roadmap
description: "Inspect or update the project's q roadmap (a GitHub Project or a local Markdown roadmap): scheduling, order, lifecycle status, dependencies, completion, and archival. Use for roadmap questions or when a q lifecycle phase needs a roadmap write."
license: MIT
---

# Q Roadmap

The configured roadmap is the portfolio source of truth for delivery order and status. Specs own
scope, Plans implementation decisions, ledgers execution, candidates delivery, and delivery records
completed knowledge; see [artifacts](../q-workflow/references/artifacts.md). Read the project
configuration and addenda per [config](../q-workflow/references/config.md), then only the backend
for `roadmap.backend`: [github-project](references/github-project.md) or [local](references/local.md).
With `none`, write nothing: report that no roadmap is configured and name `q-workflow` setup.

## Preserve the model

Every backend holds these fields per item:

| Field | Values or purpose |
| --- | --- |
| `Status` | Backlog, Ready, In progress, In review, Done |
| `Roadmap order` | One-based contiguous portfolio order |
| `Kind` | `Feature`: product capability; `Change`: workflow, documentation, refactor, tooling, or maintenance; `Candidate`: prospective work not yet in the full lifecycle |
| `Lifecycle` | Current lifecycle fact, or Not started |
| `Next gate` | Next user or automatic workflow checkpoint |
| `Dependencies or blockers` | Current prerequisites and blockers |
| `Priority rationale` | Why the item holds its approved position |

An item's body opens with one outcome sentence and may add useful shaping context (capabilities,
dependencies, shared-logic ownership, risks, open decisions, evidence pointers) plus one compact line
of existing durable Spec, Plan, candidate, and Archive references. A full-lifecycle delivery has no
delivery issue. Never paste a full Spec, Plan, or ledger into the roadmap; repository Markdown stays
authoritative.

Lower Roadmap order means earlier intended priority; only a concrete dependency or explicit user
scheduling decision prohibits parallel work or merge.

## Apply an operation

For a report, write nothing and return items grouped by Status and ordered by Roadmap order, with
lifecycle, next gate, and material blockers.

For a write:

1. resolve the exact item and the requested factual or scheduling change;
2. read the roadmap's own operating rules when it has them (a Project README or the local file's
   preamble);
3. require user approval, asked under
   [Decision Questions](../q-workflow/references/decision-questions.md), for reordering, skipping, or
   extracting a dependency, but not for factual lifecycle or status updates;
4. update only the affected fields and the bounded reference line;
5. renumber only when inserting, removing, moving, or archiving an item, preserving relative order;
6. archive delivered work rather than deleting it; and
7. read back and verify uniqueness, field values, ordering, and final state.

Write roadmap facts only after their commit or candidate exists. On resume, continue from the first
incomplete projection without repeating a correct Git mutation. Report and retry a roadmap failure;
it never rolls back or blocks an otherwise authorized merge or post-merge archive commit.

## Transitions

- Spec start: Backlog; Lifecycle `Spec drafting`; next gate Spec approval.
- Spec approval: Ready; record the approval OID; next gate Plan.
- Plan approval: remain Ready; Lifecycle `Plan approved`; next gate Reconcile Prepare.
- Reconcile Prepare: remain Ready; add durable Spec and Plan references; next gate Implement.
- Implement start: In progress; Lifecycle `Implementation in progress`.
- Candidate published: In review; add the candidate reference; next gate Reconcile Integrate.
- Merged: Done; Lifecycle `Merged`; next gate `Archive`.
- Archive: add the durable Archive reference, Lifecycle `Archived`, archive the item, then renumber
  the remaining active items without changing relative order.
- Discard: Backlog; put any remaining decision in `Dependencies or blockers`; Lifecycle
  `Discarded after risk repair`; next gate `Manual issue scheduling`. `Blocked` is a tracker status,
  not a roadmap Status option.

## Report

Name the item, final Status and Roadmap order, Lifecycle, Next gate, dependency changes, and any
pending projection. Reference the roadmap.
