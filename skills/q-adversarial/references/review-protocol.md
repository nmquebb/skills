# Adversarial Review Protocol

Keep the three roles independent and the final decision trace complete.

## Reviewer packet

Give each reviewer:

- the user's raw request;
- the resolved target and comparison baseline;
- applicable requirements, project guidance, accepted risks, and declined scope, including the
  threat model at `paths.threatModel` when the target crosses a boundary it records;
- raw diffs, files, logs, test output, or linked artifacts needed to inspect the target;
- the same read-only commands and tools in each reviewer context;
- its role and finding-ID prefix: reviewer A is `reviewer-a` with IDs `A-001`, `A-002`, and so on;
  reviewer B is `reviewer-b` with `B-001` onward;
- the exact contents of [reviewer-output.schema.json](reviewer-output.schema.json); a schema path
  alone produces malformed results.

Tell each reviewer to inspect the target itself, not delegate or mutate, and return only its
schema-conforming JSON. Do not reveal the other reviewer, suspected defects, or an intended verdict.

A reviewer result carries its assigned `role`, unique finding IDs with its own prefix, and `verdict`
`findings` exactly when `findings` is non-empty.

## Adjudicator packet

Give the adjudicator the same raw evidence plus both complete reviewer results and the exact
contents of [adjudication-output.schema.json](adjudication-output.schema.json). It verifies cited
evidence rather than voting or averaging severity, and merges findings only when their underlying
claim and required resolution are materially the same.

Invariants:

- reviewer A's findings use `A-` IDs and reviewer B's use `B-` IDs;
- every reviewer finding ID appears in exactly one decision's `sourceFindingIds`;
- every decision cites at least one reviewer finding;
- every `debate-required` decision has one `disagreements` entry carrying the question and both
  reviewers' positions;
- `confirmed`: repository or artifact evidence establishes the claim;
- `dismissed`: the claim is disproved, immaterial, duplicated, or outside approved scope;
- `debate-required`: reviewer positions materially conflict and evidence may settle them;
- `user-feedback-required`: evidence cannot settle a genuine choice or remaining conflict;
- silence by one reviewer is not disagreement;
- severity expresses user or system impact, not reviewer confidence.

A material discrepancy is a conflict about whether a claim is true, whether its impact changes
priority, whether it requires user preference, or which incompatible resolution is necessary. Minor
wording differences and complementary findings need no debate.

A material concern the adjudicator finds that neither review raised goes to both reviewers as a
challenged candidate before it may become a decision: the adjudicator names it in `limitations`,
each reviewer answers in its own context with a reviewer result for that candidate alone that
continues its ID sequence, and the adjudicator maps any resulting findings like the rest.

## Debate packet

For each disputed decision, give both original reviewers the decision ID, adjudicator question,
relevant raw evidence, both original positions, and the exact contents of
[debate-output.schema.json](debate-output.schema.json); in later rounds add both prior debate
responses. Do not reveal the adjudicator's preferred outcome.

A maintained position must answer the strongest opposing evidence, a revised one must state what
changed, and a withdrawn one must identify the disproving evidence or mistaken premise. A debate
result carries the reviewer's own `role` and exactly one response per disputed decision it was
sent.

## Final checks

Before reporting, ensure that:

- the final adjudication contains no `debate-required` status;
- every source finding remains mapped exactly once;
- every confirmed finding has evidence and a concrete required action;
- every user-feedback item has one answerable question and the viable positions;
- the decision ledger includes dismissed findings and their rationale;
- no reviewer or adjudicator changed the target.
