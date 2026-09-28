# Lightweight Issue Implementation

Work directly in the current session. The approved issue contract is the planning artifact; create
no Spec, Plan, ledger, managed lifecycle workspace, archive, or roadmap item. Perform tracker steps
through the [tracker backend](../../q-workflow/references/backends/tracker.md) for
`tracker.backend` and publication through the
[integration backend](../../q-workflow/references/backends/integration.md) for
`integration.host`.

## Prove the contract

Resolve the exact repository and issue. Require one well-formed `q-triage:v1` block with
`Status: approved`, baseline OID, parent and implementation branches, approval evidence, scope,
delivery policy, non-goals, acceptance criteria, plan, and verification. For asynchronous GitHub
approval, validate the proposal comment identity and digest exactly as the
[GitHub tracker](../../q-workflow/references/backends/tracker-github.md#asynchronous-approval)
defines them. Never repair a malformed contract from Implement.

Require the branch shape `branches.issue` names, with type `feature`, `fix`, `chore`, or `release`;
keep a differently shaped branch only when the contract already records it. Fetch the parent and
require the approved baseline to remain its ancestor. Return to Triage only when parent movement
changes the approved outcome, owner, contract, migration, acceptance, or verification strategy.

## Establish ownership

Create or resume the exact recorded branch from the fetched parent. If another worktree owns it,
report that path and stop. Preserve unrelated staged, modified, or untracked work; never stash,
reset, absorb, or delete it, or rewrite published history. Set the issue to `inProgress` once branch
ownership is proved.

## Implement and verify

Implement the approved plan directly, using repository conventions for ordinary latitude. Search
existing owners and call sites before adding abstractions or dependencies. Commit coherent work and
keep failures local; publish no progressive or failed draft.

For a behavior change or gap-driven bug fix, load [q-tdd](../../q-tdd/SKILL.md) before
implementation. Follow its test selection and intended red-then-green procedure, and preserve the
evidence on the issue. If an existing test already protects the change, name it and record its
green result instead of adding a duplicate.

Run focused evidence for the affected behavior, broadening it when the contract crosses owners;
inspect the complete diff and status; apply [q-code-quality](../../q-code-quality/SKILL.md) once.
Record actual failures and omissions in the candidate rather than calling them passed. Merge-lean
delivery does not wait for CI.

Use `manual-risk` only for the lifecycle's high-consequence boundaries or explicit user review. For
manual-risk work, run one fresh agent on the `riskGate` route; it may make one bounded repair and
rerun the affected proof. If it cannot make the work safe, publish no candidate, reset only the
proved issue-branch work, set the issue to `blocked`, and leave one concise issue note with the
risk, failed repair, and suggested follow-up. The existing issue is the ledger; create no other
issue automatically.

## Publish and deliver

Publish the clean issue branch as one ready candidate with explicit repository, base, head, and
body arguments where the host takes them. Stop on several matching candidates or a conflicting
closed-unmerged one. Fill the body from real evidence, including `Planning contract: <issue
reference>`, and perform the tracker's **link** operation, which differs by tracker and host (a
closing reference in the body, or a note on the issue); never assume `Closes #<n>`. Never
force-push or create several candidates.

For ordinary `merge-lean` work, inspect the candidate again, verify the expected base and exact
published head, disclose current checks without waiting, and merge with `integration.mergeMethod`
and the host's exact-head guard; never bypass host rules administratively. If the parent moved and
the host reports a conflict, run [q-reconcile](../../q-reconcile/SKILL.md) Issue conflict, republish
the repaired head, then resume this merge step.

For `manual-risk`, after the risk-gate pass leave the ready candidate for explicit user review;
never merge it automatically. Set the issue to `inReview`. On approval, merge the exact reviewed
head; if declined, discard the candidate and the proved branch and leave a concise issue note.

After merge, run the backend's merge proof, close the issue through the tracker when the merge did
not already close it, delete only the exact merged local and remote issue refs with ancestry or
expected-OID protection, and restore no unproved runtime. Report the issue and candidate references,
delivered head, merge result, evidence, and any uncertainty. This lane has no Archive phase.
