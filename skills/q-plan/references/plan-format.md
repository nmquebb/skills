# Plan Artifact Format

Use this structure proportionally:

```markdown
# <Delivery> Implementation Plan

## Status

- Status: draft | approved
- Approved at: pending | <first approval UTC timestamp>
- Specification: [spec.md](spec.md)
- Parent remote: <remote>
- Parent branch: <branch>
- Branch type: feature | fix | chore | release
- Implementation branch: pending | <branch from `branches.lifecycle`>
- Delivery policy: merge-lean | manual-risk — <exact trigger when manual-risk>

## Existing system and ownership

## Public contracts and data flow

## Compatibility, migrations, and failure behavior

## Current guidance and ADR ownership

- Required current-guide updates: none — <why no current guide changes> | <paths and the behavior they must describe>
- ADR: required at `<paths.decisions>/YYYY-MM-DD-<slug>.md` | none — <disposition>
- Delivery checks: none configured | <each check, its answer, and the required change>

## Implementation ownership and review

- Topology: single-owner | delegated — <concrete reason when delegated>
- Owner route: <explicit user route | `implementationOwner` route | invoking session>
- Final reviewer: <route selected at Implement; fresh and read-only>
- Earlier review: none | <consequential boundary and why dependent work must wait>
- Optional scout or workers: none | <contribution, ownership, integration, and cost to measure>
- Context: the re-grounding protocol and the ledger's current state
- Stop: delivered | durable blocker with exact resume condition | user stop
- Manual-risk gate: not applicable | one fresh `riskGate` repair and risk pass

## Implementation milestones

### <N>. <Coherent outcome>

- Commit: `<conventional commit message>`

Outcome and acceptance:

Owner, reuse, and expected boundary:

Contract, failure, compatibility, or migration behavior:

Applicable guidance and design consequences:

Slice worker route and escalation: <worker role and route, and the failure that triggers escalation>

Targeted verification:

## Final readiness evidence

- <focused typecheck, test, integration, smoke, or browser evidence that adds real confidence>
- Project format check and lint, complete diff, and independent code-quality review
- Known gaps to disclose under merge-lean: none | <facts>

## Reconciliation and running-app review

- Integration relationship: independent | stacked | overlap needing Prepare reconciliation
- Running-app evidence: not needed | <commands, surfaces, and URLs>
- Runtime and database ownership: none | <cleanup and restoration concern>

## Material risks and review

## Optional Plan review

- Trigger: none | material ambiguity | consequential risk | user request
- Status: not run | completed | waived | replaced
- Route: <`planReviewer` route> read-only
- Verdict and disposition: not applicable | <evidence and resolution>
```

Every acceptance criterion maps to a milestone or final evidence. Commands should be precise enough
to run without turning the Plan into a transcript. Keep the Plan compact; include types or
pseudocode only when they settle a material contract.
