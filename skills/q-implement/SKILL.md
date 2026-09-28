---
name: q-implement
description: "Deliver approved q Spec and Plan work, or an approved lightweight q-triage issue, as one ready candidate with proportional verification. Explicit invocation only."
license: MIT
disable-model-invocation: true
---

# Q Implement

Deliver the approved outcome; the Plan is not a line-by-line script. Read the project configuration
and addenda per [config](../q-workflow/references/config.md); the project's code-style guidance in
full (`conventions.codeStyle`, plus the [baseline](../q-code-quality/references/code-style.md)
unless `conventions.baseline` is `false`); and the relevant
[lifecycle](../q-workflow/references/lifecycle.md) and architecture sections
(`conventions.architecture`). For full-lifecycle work, also read
[artifacts](../q-workflow/references/artifacts.md). Follow the nearest repository guidance and the
affected code's owning contract.

## Select the lane

- **Full lifecycle:** use the approved Spec, Plan, ledger, completed Reconcile Prepare record, and
  roadmap item when configured. Work only in the recorded implementation workspace and branch under
  [references/orchestration-protocol.md](references/orchestration-protocol.md).
- **Lightweight issue:** require one approved `q-triage:v1` block and follow
  [references/issue-protocol.md](references/issue-protocol.md). Create no lifecycle artifacts or
  roadmap item.

Never downgrade full-lifecycle work to the issue lane or invent lifecycle artifacts for issue work.
Return to Spec or Plan only when new evidence materially changes the approved outcome, boundary,
owner, public contract, migration, or verification strategy.

## Reconstruct the full-lifecycle gate

Read the approved Spec and Plan and the ledger's current state and relevant decision and evidence
entries. Verify the recorded remote, parent and implementation branches, fork and approval commits,
launcher workspace when recorded, worktree, runtime ownership, Git status, and relevant host state.
The prepared workspace must belong to the recorded repository; never create a replacement workspace
from the current directory in Implement. Preserve unrelated changes; stop on ambiguous ownership.

Record `Implementation started at`, the delivery policy (`merge-lean` default or `manual-risk`),
and the selected implementation and review routes. When a roadmap is configured, move the item to
In progress; a failed roadmap write is recorded for Archive or manual recovery and blocks nothing.

## Implement and review

The orchestration protocol owns the owner/worker split, slice re-grounding, and the one independent
final review. Readiness, evidence reuse, and failure correction follow
[Implementation and verification](../q-workflow/references/lifecycle.md#implementation-and-verification);
load [q-tdd](../q-tdd/SKILL.md) for behavior changes and keep its intended red and green evidence.
Complete the Plan's named current-guide updates, ADR disposition, and delivery-check changes before
readiness (Archive does none of them). Publication facts need no extra worker or verifier. Publish
no progressive work: one ready candidate at the end, with failures and recovery kept local.

## Handle manual risk once

Use `manual-risk` only for a boundary in
[Delivery policy](../q-workflow/references/lifecycle.md#delivery-policy), including configured
`risk.boundaries`, or explicit user review. Size, file count, dependency changes, or a failed check
alone are not manual-risk.

Before publishing manual-risk work, launch one fresh agent on the `riskGate` route with the
authoritative artifacts, diff, evidence, and concrete risk. It may make one bounded repair commit and
rerun the affected proof, then returns one binary result:

- **pass:** fold the repair into coherent delivery history when appropriate, record the route and
  result, and independently confirm the repaired boundary before continuing;
- **discard:** publish no candidate; present options under
  [Delivery policy](../q-workflow/references/lifecycle.md#delivery-policy) and wait for the user. If
  the user discards, give Reconcile Discard the exact branch, workspace, owned runtime, and a brief
  ledger note (outcome, risk, failed repair, suggested manual-issue title).

No committee, second repair worker, or automatic issue. If a ready candidate already exists when the
risk is discovered, Reconcile Discard discards it before cleanup. On a host that cannot launch a
fresh agent, the gate follows
[Routing rules](../q-workflow/references/orchestration.md#routing-rules): a session the user
starts, another launcher, or a recorded waiver.

## Publish one ready candidate

Commit every task-owned change and require a clean worktree; that head is the reviewed head the
final review judged. Publish through the
[integration backend](../q-workflow/references/backends/integration.md) for `integration.host`:
its **publish** pushes the reviewed head when the host needs it, creates or updates the one ready
candidate against the recorded parent, and commits the ledger transition that records the
candidate reference, [reviewed head](../q-workflow/references/backends/integration.md#reviewed-head-and-candidate-head),
policy, and `Candidate published at`. Never force-push or create a second candidate. Build the body
from actual evidence per the
[candidate body](../q-workflow/references/backends/integration.md#candidate-body), stating
validation failures or omissions plainly, with the lifecycle marker:

```text
<!-- q-lifecycle:v1 slug=<slug> policy=<merge-lean|manual-risk> -->
```

Media is best-effort context, not a gate: when the work already opened a browser, simulator, or
rendered UI, or the user or Plan requests media, capture a representative frame with
[q-computer-use](../q-computer-use/SKILL.md) and attach it as the backend allows.

When a roadmap is configured, move the item to In review with Reconcile Integrate as the next gate;
record and continue past a projection failure.

For `merge-lean`, immediately hand the exact candidate head to [q-reconcile](../q-reconcile/SKILL.md)
Integrate. For `manual-risk`, report the risk-gate result and hand the candidate to Reconcile for
the user-review decision. Archive runs only after merge, per `archive.trigger`.
