# Spec and Ledger Artifact Format

## Specification

Use these headings unless one is genuinely irrelevant:

```markdown
# <Delivery title>

## Status

- Status: draft | approved
- Approved at: pending | <first approval UTC timestamp>
- Baseline: <commit>
- Parent remote: <remote>
- Parent branch: <branch>

## Problem

## Users and outcomes

## Requirements

## Evidence and justification

| Decision or claim | Evidence | Kind |
| ----------------- | -------- | ---- |

## Non-goals

## Risks and mitigations

## Acceptance criteria

## Sources
```

Kind is Repository, External, User decision, or Inference.

## Ledger

```markdown
# <Delivery> Ledger

## Status

- Phase: spec
- Active milestone: discovery
- Spec owner: <actual route and mode, or "invoking session">
- Plan owner: <actual route and mode, or "invoking session">
- Delivery policy: pending | merge-lean | manual-risk — <reason when manual-risk>
- Implementation owner: pending | <owner identity and route>
- Owner route: pending | <route and mode actually used>
- Final reviewer: pending | <route and mode actually used>
- Started at: <UTC timestamp>
- Spec approved at: pending | <first approval timestamp>
- Plan approved at: pending | <first approval timestamp>
- Reconcile prepared at: pending | <timestamp>
- Implementation started at: pending | <timestamp>
- Implementation ready at: pending | <timestamp>
- Candidate published at: pending | <timestamp, candidate reference, and reviewed head OID>
- Merged at: pending | <host timestamp, retained head, and merge commit>
- Archive started at: pending | <timestamp>

## Current state

- Outcome completed and current tree/commit:
- Active acceptance and canonical guidance links:
- Relevant decisions, exceptions, and waivers:
- Evidence location and environment:
- Unresolved risk and next slice:

## Delivery lineage

- Parent remote: <remote>
- Parent branch: <branch>
- Branch type: pending | feature | fix | chore | release
- Implementation branch: pending | <branch>; created by Reconcile Prepare

## Decisions

| Header | Decision | Source |
| ------ | -------- | ------ |

## Pauses

| Started | Ended | Reason |
| ------- | ----- | ------ |

## Events

| At  | Phase | Type | Detail | Resolution |
| --- | ----- | ---- | ------ | ---------- |

## Planning reviews

| Phase | Trigger | Route | Agent | Verdict and findings | Disposition |
| ----- | ------- | ----- | ----- | -------------------- | ----------- |

## Implementation evidence

| Milestone or checkpoint | Owner | Commit | Validation | Result |
| ----------------------- | ----- | ------ | ---------- | ------ |

## Workflow usage and review value

<Session and attempt IDs, usage evidence, review findings and dispositions.>

## Counters

- Green milestones: 0
- Planning agent launches: 0
- Implementation agent launches: 0
- Independent review launches: 0
- Risk-gate repairs: 0
- Plan revisions: 0
- Verification command reruns: 0
- User-steering events: 0
- Rework events: 0
- Discarded attempts: 0

## Exit interview candidates

None.

## Unresolved items

None.
```

[Lifecycle](../../q-workflow/references/lifecycle.md) owns roles and ledger branch ownership.
Reconcile Prepare adds the [reconciliation block](../../q-reconcile/references/reconciliation-record.md);
do not pre-copy it into Spec. [Metrics](../../q-workflow/references/metrics.md) owns usage fields
and counter semantics. Record each decision-question answer under Decisions by its header. Update
Current state at slice and recovery boundaries; history lives in Events.

Original milestone timestamps are immutable. Record amendments, returns, escalation reasons,
verification waivers, and changed facts as append-only events. Valid event types include
`approval`, `steering`, `discovery`, `reconciliation`, `deviation`, `blocker`, `resolution`,
`waiver`, `resume`, `merge`, and `discard`.

For a durable blocker, record one `blocker` event and unresolved item with cause, evidence, owner,
and resume condition; record a later resolution once rather than rewriting history. For discarded
manual-risk work, add one `[manual-issue]` unresolved item with the attempted outcome, failed
risk-gate repair, discarded head, and suggested issue title; Reconcile preserves it on the parent.

Record every implementation worker and verifier actually launched. Workers increment Implementation
agent launches and verifiers Independent review launches; the phase-owning implementation session
increments neither but counts in total usage. The one permitted manual-risk repair counts under
`Risk-gate repairs`.

Use stable exit-interview IDs. A candidate may be pending or already decided:

```markdown
### EI-001 — <short title>

- Status: pending | decided
- Source: steering | discovery | follow-up feedback
- Raised at: <UTC timestamp>
- Question: <only when unresolved>
- Options: <only when unresolved>
- Decision: pending | <user's settled direction and rationale>
- Follow-up: pending | archive documentation | project addendum | `q-improve-skills` | implementation | none
```

Never manufacture options or re-ask a decided item. Record immediate product resolution separately
from a reusable follow-up.
