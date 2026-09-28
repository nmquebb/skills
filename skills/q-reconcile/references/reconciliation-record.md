# Reconciliation Record

Reconcile Prepare appends this block to the active ledger. Use `none` when an owned resource does
not exist; never omit an identity that cleanup may need.

```markdown
## Reconciliation

- Parent remote and branch: <remote>/<branch> | local <branch>
- Parent fork SHA: <full OID>
- Approved Spec OID: <full OID>
- Approved Plan OID: <full OID>
- Artifacts published via: parent | implementation branch — <rejection when a push was refused> | local only
- Implementation branch: <branch>
- Delivery policy: merge-lean | manual-risk — <reason when manual-risk>
- Workspace: worktree <absolute path> | branch in control checkout <absolute path>
- Launcher workspace: none | <launcher, project ID, and workspace ID>
- Workspace setup: <commands and environment-input paths or names, never secret values>
- Delivery runtime: none | reuses-parent | <owned container project and teardown command>
- Delivery processes: none | <working directory, start/stop commands, and supervised identity>
- Parent runtime before Prepare: off | <identity, state, restore command, and health check>
- Parent database before Prepare: absent | <owned/external identity, state, restore command, and check>
- Shared database effect: none | <required merged-parent stabilization>
- Candidate: pending | <pull request number, URL, base, and branch> | local branch <branch>
- Reviewed head: pending | <full OID the final review judged; never the recording commit's own OID>
- Risk gate: not-required | pending | <route, risk, head, verdict, and evidence>
- Integration: pending | <merged head, merge commit, timestamp, and policy>
- Cleanup: pending | <completed and retained exact resources>
```

## Prepare evidence

Record the fetch result, clean-parent proof, sibling and dependency facts that materially affect
the base, artifact publication OIDs, roadmap projection result, created or resumed workspace, and
runtime ownership. Keep the reviewed head as history, but inspect the current candidate head before
every Reconcile action and after every published correction rather than recording a self-stale
head. Copy no secrets or long command logs.

## Integration evidence

Record the fetched parent and candidate head, current check conclusions, review state, parent-drift
action, policy, merge command result, retained head, merge commit, and merge proof. Under
merge-lean, nonpassing checks are disclosures, not waivers; under manual-risk, reference the
current-head risk-gate pass and explicit user approval. After merge these facts go in the
`q-reconcile-complete:v1` record the integration backend names, not a parent edit to the ledger
Archive replaces.

## Cleanup evidence

Record every process, container project, worktree, local ref, remote ref, runtime, and database
state stopped, removed, restored, retained, or unprovable. Cleanup is idempotent: resume at the first
incomplete exact resource, never recreate a removed one, and update the same completion record after
each attempt.

## Discard evidence

Use one ledger event with type `discard` and one unresolved `[manual-issue]` entry. Include the
attempted outcome, concrete risk, risk-gate route and result, discarded head, suggested issue title,
and exact cleanup result. The note is scheduling input for the owner, not authority to create an
issue.
