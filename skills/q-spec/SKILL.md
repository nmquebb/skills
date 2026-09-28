---
name: q-spec
description: "Create or revise the approved specification for a q full-lifecycle delivery: outcome, boundaries, evidence, and observable acceptance. Explicit invocation only; no implementation."
license: MIT
disable-model-invocation: true
---

# Q Spec

Define the outcome without designing implementation. Read the project configuration and addenda
per [config](../q-workflow/references/config.md), the relevant
[lifecycle](../q-workflow/references/lifecycle.md) sections, the project's code-style guidance
(`conventions.codeStyle`, else the [baseline](../q-code-quality/references/code-style.md)), plus
[artifact format](references/artifact-format.md) and [artifacts](../q-workflow/references/artifacts.md).

Run directly as the Spec owner (`specOwner` route when configured, per
[orchestration](../q-workflow/references/orchestration.md)); never launch the phase owner as a
child. An explicit user route wins; when invoked on a different configured route, preserve state
and request continuation on the required route.

## Establish the work

When a roadmap is configured, read [q-roadmap](../q-roadmap/SKILL.md) and inspect the roadmap. Inspect
the branch, `git status`, configured remotes, applicable guidance, repository documentation,
relevant code, and any matching active or archived delivery. For new work, default the parent to
`git.remote` and `git.parentBranch` and perform Spec there; use another current parent only when
the user or repository context establishes it. Record both parent coordinates. A full-lifecycle
delivery has no delivery issue: create none, and neither create nor switch to an implementation
branch during Spec (Plan sets branch identity after approval). Reuse existing artifacts; create
`<paths.work>/<slug>/spec.md` and `ledger.md` only when no durable active record exists. Preserve
user-authored and resumed content.

When creating those artifacts with the Paseo launcher, first rename the current workspace to the
exact human-facing delivery title per the [Paseo launcher](../q-workflow/references/launchers/paseo.md#projects-and-workspaces).
This is UI metadata, not lifecycle evidence. Do not rename for an unrelated existing Spec discovered
or resumed.

When creating the durable artifacts and a roadmap is configured, add the delivery to its Backlog
with its `Kind`, draft Spec readiness, and a one-sentence outcome. `Kind` is `Feature` for a product
capability and `Change` for workflow, documentation, refactor, tooling, or maintenance work; a
full-lifecycle delivery is never a `Candidate`. Do not link the uncommitted draft. Use the user's
established placement or append without changing existing order; include priority placement in the
decision frontier when the user has not settled it. On approval, refresh phase, next gate,
dependencies, and blockers without silently reordering other work.

Record Started once and keep original approval timestamps stable. Do not require a clean worktree
when existing changes clearly belong to the resumed delivery.

## Discover and decide

Search existing behavior, owners, callers, dependencies, and tests before asking questions,
following [code retrieval](../q-code-quality/references/code-retrieval.md). Use primary sources
only when an external fact is material. Separate repository evidence, external evidence, user
decisions, and inference.

Ask the complete currently answerable frontier of material decisions under
[Decision Questions](../q-workflow/references/decision-questions.md): audience, problem, outcome,
boundaries, constraints, user-visible behavior, failure policy, compatibility, risk, and observable
acceptance. Never ask implementation detail or repeat a decision the user already made. Include
each configured [delivery check](../q-workflow/references/config.md#delivery-checks) that repository
evidence does not settle, and record every answer as a decision the Plan carries forward.

The direct Spec owner owns discovery and writing. Launch at most one fresh, read-only specification
reviewer on the `specReviewer` route, only when the user requests it or material ambiguity or
consequence justifies an independent challenge, following
[references/spec-reviewer.md](references/spec-reviewer.md). Its findings are advice subject to user
authority, not new requirements; do not re-run the review after edits.

## Write and approve

Write a proportional spec from the artifact contract (small work, small spec) with:

- a concrete problem and outcome;
- evidence and explicit inference;
- boundaries and strong non-goals;
- observable acceptance;
- material risks and settled user decisions.

Self-review for contradictions, unnecessary scope, hidden implementation design, and unobservable
acceptance. Present consequential decisions and ask for approval as the final question of the last
batch; a clear instruction to continue suffices.

On approval, inspect the focused artifact diff and commit `docs: approve <slug> spec`. Resolve that
full local commit OID, then, when a roadmap is configured, use `q-roadmap` to move the item to Ready
with the factual approved-Spec lifecycle and Plan as the next gate. Keep the one-sentence body and
record the OID in the lifecycle field, but add no artifact link until Reconcile Prepare publishes
it. Refetch and verify the fields against the durable commit; a failed roadmap write resumes there
without recommitting the matching artifact.

If the user also asked to continue, load and follow [q-plan](../q-plan/SKILL.md); otherwise name
Plan as the next phase per [Communication](../q-workflow/references/lifecycle.md#communication).
Never implement code from Spec.
