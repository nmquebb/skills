---
name: q-plan
description: "Plan an approved q specification in the opted-in q lifecycle: owners, contracts, milestones, delivery policy, and verification. Explicit invocation only."
license: MIT
disable-model-invocation: true
---

# Q Plan

Plan the approved outcome. Read the project configuration and addenda per
[config](../q-workflow/references/config.md), the relevant
[lifecycle](../q-workflow/references/lifecycle.md) sections, the project's code-style and
architecture guidance (`conventions.codeStyle`, `conventions.architecture`, else the
[baseline](../q-code-quality/references/code-style.md)), plus [plan format](references/plan-format.md)
and [artifacts](../q-workflow/references/artifacts.md).

Run directly as the Plan owner (`planOwner` route when configured, per
[orchestration](../q-workflow/references/orchestration.md)) with write access; never launch the
phase owner as a child. An explicit user route wins; when invoked on a different configured route,
preserve state and request continuation on the required route. Route availability never changes the
approved outcome.

## Reconstruct the work

Require an approved Spec. Read the Spec, ledger, roadmap item when configured, recorded parent,
current Git state, existing owners, reusable logic, callers, contracts, and meaningful test seams,
following [code retrieval](../q-code-quality/references/code-retrieval.md). Keep Plan on the parent
branch; Reconcile Prepare creates the implementation branch.

Ask only decisions that change the outcome, ownership, public contract, compatibility, migration,
failure policy, delivery risk, or verification value. Ask the complete current frontier together
under [Decision Questions](../q-workflow/references/decision-questions.md), preserving answers
already given.

## Delegate focused planning when useful

Keep small or tightly coupled slices with the Plan owner. For substantial independent
investigations, the owner may use fresh read-only agents after proposing boundaries and settling
shared ownership and contracts. Parallelize only independent work; boundaries remain provisional,
and no slice requires an agent. On a host without a subagent tool, investigate sequentially.

Give each agent approved acceptance, settled decisions, expected owners, and canonical paths, never
the full conversation. Ask for reusable code, affected consumers, material behavior decisions,
verification, and guidance that changes design. Link each applicable convention and consequence in
the Plan; copy no general style checklist.

The owner resolves conflicting assumptions, duplicate logic, and competing owners before combining
findings. Agents neither approve the Plan nor replace risk-triggered review. Record contribution
and usage under [metrics](../q-workflow/references/metrics.md#usage-evidence).

## Write a decision-sufficient plan

For each meaningful milestone record:

- the observable outcome and acceptance it closes;
- the owning subsystem and important reuse;
- material contract, data-flow, failure, compatibility, or migration behavior;
- applicable local guidance;
- the smallest useful verification; and
- a coherent commit outcome.

Known paths are expected boundaries, not exhaustive allowlists; nearby task-owned files are allowed
when acceptance needs them. Do not prescribe ordinary syntax or force a milestone per file or layer.
Size each slice so one fresh worker can finish it, including its checks and quality pass, without
compaction; split a milestone that cannot.

Record the delivery policy and its exact trigger under
[Delivery policy](../q-workflow/references/lifecycle.md#delivery-policy). Name consequential
boundaries that need review before dependent work, and preserve user-selected routes.

Name each current guide Implement must update, and state whether an ADR is required or `none`. An
ADR is warranted when a decision crosses owners, establishes a lasting constraint, rejects a
plausible alternative, or is costly to reverse; it is not a retroactive delivery receipt. Carry
every [delivery check](../q-workflow/references/config.md#delivery-checks) answer forward; a yes
names its required change among the updates.

## Verification

Select the smallest evidence that protects acceptance under the
[readiness rules](../q-workflow/references/lifecycle.md#implementation-and-verification). Record
gaps accurately; add no duplicate complete gates or tests for type or framework guarantees. For
planned behavior changes, name the test kind, intended red observation, and green evidence that
Implement will obtain under [q-tdd](../q-tdd/SKILL.md); do not prescribe tests per implementation
layer.

Run one fresh read-only Plan review on the `planReviewer` route only for material ambiguity,
consequential risk, or a user request. Launch it read-only to challenge Spec fidelity, architecture,
failure and migration behavior, milestones, and verification without reopening settled product
decisions. Incorporate or record its evidence; no review-until-pass loops.

## Approve and continue

Ask for approval as the final question of the last batch; a clear instruction to continue approves
a decision-sufficient plan. Keep the first approval timestamp stable and record later amendments as
events and revision-count changes. Return to Spec only when the approved outcome, boundary, or
acceptance changes materially.

After approval:

1. record the branch type and the implementation branch named by `branches.lifecycle`;
2. record the delivery policy and any manual-risk trigger in Plan and ledger;
3. commit `docs: approve <slug> plan` with the approved artifacts;
4. when a roadmap is configured, update it to Plan approved with Reconcile Prepare as the next
   gate; and
5. verify the focused repository and roadmap facts.

Create no full-lifecycle delivery issue; Reconcile Prepare publishes the approved artifact commits
and their durable roadmap references. If the user also asked to continue, load
[q-reconcile](../q-reconcile/SKILL.md) in Prepare mode; otherwise name it as the next phase.
