---
name: q-reconcile
description: "Prepare isolated q lifecycle work, integrate an exact ready candidate head, perform an authorized manual-risk discard, or resolve a lightweight issue branch conflict. Explicit invocation only."
license: MIT
disable-model-invocation: true
---

# Q Reconcile

Make transitions recoverable without approval ceremony. Read the project configuration and addenda
per [config](../q-workflow/references/config.md), the relevant
[lifecycle](../q-workflow/references/lifecycle.md) sections,
[references/reconciliation-record.md](references/reconciliation-record.md),
[artifacts](../q-workflow/references/artifacts.md), and the
[integration backend](../q-workflow/references/backends/integration.md) for `integration.host`. For
full-lifecycle work also read the approved Spec and Plan, the ledger's current state and relevant
evidence, and, when a roadmap is configured, [q-roadmap](../q-roadmap/SKILL.md) and the roadmap
item.

Git, the integration host, the worktree registry, and recorded runtime identities are truth.
Preserve unrelated work and resume from the earliest incomplete checkpoint. Generated files named by
project guidance are changed only through their owning tool, and their regenerated output is
committed with the work that produced it rather than treated as unrelated drift.

## Choose the mode

- **Prepare:** after Plan approval, publish approved artifacts and establish the isolated
  implementation branch and workspace.
- **Integrate:** after Implement publishes one ready lifecycle candidate, merge its exact head and
  clean delivery-owned resources. Archive follows the merge and is not a prerequisite.
- **Discard:** after a failed manual-risk gate and the user's discard decision, preserve a brief
  durable ledger note and remove the unmerged delivery.
- **Issue conflict:** merge the current parent into an approved lightweight issue branch, resolve
  its conflict, run affected evidence, and republish without merging.

Prepare, Integrate, and Discard run from the clean control checkout that owns the parent branch,
never an implementation worktree they may remove; resolve it with `git worktree list --porcelain`.
If another exact workspace owns it, continue there through the launcher when available or report
the concrete resumption path; never create a duplicate checkout or mutate an ambiguous worktree.
With `git.workspace: branch`, the control checkout switches between the parent and implementation
branches and must be clean at each switch. Issue conflict runs in the exact issue workspace.

## Preserve invariants

- Resolve the repository, remote, branches, candidate, OIDs, paths, workspace, processes, container
  project, and database ownership from durable evidence, not similar-looking names.
- Never rewrite published history, force-push, bypass host rules administratively, broadly prune,
  stash unrelated work, or delete an unproved resource.
- Roadmap writes follow durable Git state. Record a roadmap outage for Archive or manual recovery;
  it never rolls back an otherwise valid merge.
- Return to Plan only for a material approved-plan change, and to Implement for executable repair
  beyond a bounded conflict resolution.

## Prepare

Require an approved Spec and Plan, recorded parent, implementation branch, and a clean parent
checkout. Fetch the remote when one exists. Fast-forward a clean local parent; if the approved
artifact commits are the only local commits ahead of a newly advanced remote parent, replay just
those unpublished commits after confirming the Plan remains valid. Stop on conflicts, executable or
unrelated local commits, ambiguous upstreams, or published-history rewrites.

Publish the approved artifact commits and fix the branch's start point:

- `github`: push them normally to the explicit parent ref, fetch, and record the parent as
  `Parent fork SHA`; the branch starts there. If a branch-protection rule rejects the push, record
  the rejection and fetch: `Parent fork SHA` is the fetched parent, the branch starts at the local
  parent (the approved artifact commits on top of it), and you create the branch there and push it
  normally now, before anything links to the artifacts.
- `local`: record the local parent as both `Parent fork SHA` and start point; push only when
  `integration.push` is `true`. Local OIDs are already durable.

Only then resolve durable OIDs for the Spec and Plan and, when a roadmap is configured, project their
references. Record which ref published them (parent or implementation branch) and any failed
roadmap write for later recovery.

Create or resume the exact implementation branch at its start point:

- `worktree`: one isolated plain-Git worktree:
  `git worktree add -b <branch> <worktreeRoot>/<slug> <start point>`, or
  `git worktree add <worktreeRoot>/<slug> <branch>` when the branch already exists. Never reuse a
  nonempty path or a branch another worktree owns. With the Paseo launcher, register the path as a
  workspace per the
  [Paseo launcher](../q-workflow/references/launchers/paseo.md#projects-and-workspaces).
- `branch`: create the branch at its start point, or resume it, and check it out in the clean
  control checkout.

Run `commands.install` there when the project needs setup. Record setup, workspace identity, and
runtime ownership before starting anything. Parent infrastructure stays parent-owned unless an
explicit isolated project is created and recorded; record every delivery process and its exact stop
identity. Never copy secret values into the ledger.

Append the reconciliation block from the reference, commit that transition on the implementation
branch, and leave both checkouts clean. When a roadmap is configured, keep the item Ready with
Implement next. Hand off the exact implementation path and branch; if the user also asked to
continue, load [q-implement](../q-implement/SKILL.md) there.

## Integrate

Inspect the candidate through the integration backend and require exactly one ready lifecycle
candidate carrying the marker for the recorded slug and policy. Verify repository, base, head
branch, current candidate head, a clean implementation branch (published, when the host publishes),
that the approved Plan and fork are ancestors, and the range since the recorded
[reviewed head](../q-workflow/references/backends/integration.md#reviewed-head-and-candidate-head).
Record current checks and review state exactly; never describe a missing, pending, skipped,
cancelled, or failed check as passing.

When the current parent is not an ancestor of the candidate head, run the backend's `sync-parent`:
merge the current parent into the implementation branch without rebasing. Resolve straightforward
conflicts that preserve the approved outcome, run affected evidence, apply
[q-code-quality](../q-code-quality/SKILL.md) when executable code changed, commit, and republish.
Return to Implement or Plan only when resolution needs material executable or contract decisions.
Re-inspect and use the new exact head. If the recorded implementation worktree is absent, do this
drift merge in a temporary plain-Git worktree created from the control checkout and remove it after
publishing.

Apply the recorded policy's merge conditions from
[Integration](../q-workflow/references/lifecycle.md#integration): merge-lean merges immediately with
disclosed evidence; manual-risk requires the current-head risk-gate pass, green expected checks,
settled actionable review, and explicit user approval of that head. Merge through the backend with
`integration.mergeMethod` and its exact-head guard; never bypass host rules administratively or let
the host delete branches automatically. If host rules reject the merge, report their exact result
and retain all resources. If the harness denies the merge command, stop with the exact command and
head, retain every resource, and resume Integrate from this checkpoint when re-invoked; record the
wait as a pause, not a failure.

After the host reports the merge, fetch again when a remote exists and run the backend's merge
proof. Do not edit the merged parent just to backfill the active ledger; Archive owns the durable
merge record.

Clean only the exact recorded delivery-owned state:

1. stop recorded delivery processes whose identity and working directory still match;
2. tear down only a recorded delivery-owned container project whose labels confirm ownership; never
   tear down a reused parent project or remove volumes by prefix;
3. remove the clean exact implementation worktree (and its launcher workspace), or switch the
   control checkout back to the parent in `branch` mode;
4. delete the local branch only after the merge proof, and a surviving remote branch only with an
   expected-OID lease;
5. restore a recorded parent runtime or database state from the merged parent without destructive
   confirmation; and
6. verify the parent is clean and synchronized and every removed or retained resource is accounted
   for.

Never remove `<paths.work>/<slug>/`; its presence on the parent is Archive's queue. A cleanup
failure does not undo the merge: record the last completed checkpoint and leave the remaining exact
resource for a later retry.

Write the `q-reconcile-complete:v1` record through the backend: merged head, merge commit,
timestamp, delivery policy, disclosed check conclusions, any user-wait interval with start and end
timestamps, and every cleaned or retained exact resource. It is Reconcile's durable checkpoint;
Archive may proceed when it is delayed or incomplete. With `archive.trigger: after-merge`, continue
into [q-archive](../q-archive/SKILL.md) in the control checkout.

## Discard manual-risk work

Require the recorded `manual-risk` policy, a failed fresh risk-gate result, and user-authorized
discard. Before deleting the implementation branch, append one concise `[manual-issue]` entry to the
active ledger on the parent branch: attempted outcome, concrete risk or failed evidence, risk-gate
result, discarded head, and suggested issue title. Commit that ledger-only parent update and publish
it the way Prepare published artifacts, so the note survives deletion. When a roadmap is
configured, move the item to Backlog, record the blocker in `Dependencies or blockers`, and set
`Manual issue scheduling` as the next gate.

Discard an open unmerged candidate through the backend with a short pointer to the ledger note. Then
stop only proved delivery-owned processes, remove the clean exact worktree, and delete exact local
and remote implementation refs with ancestry or expected-OID protection. Never discard unrelated
changes, a merged branch, or ambiguous runtime state. Report what was discarded and where the note
lives. Create no issue automatically and do not run Archive.

## Resolve a lightweight issue conflict

Require one approved `q-triage:v1` issue, its one closing candidate, the recorded branch, and the
exact branch-owning workspace. Run the backend's `sync-parent`: fetch when a remote exists, then
merge the current parent into the issue branch without rebasing or force. Resolve only conflicts
needed to preserve the approved issue outcome and current parent behavior. Run affected focused
evidence, inspect the merge diff, commit if needed, republish, and verify the candidate head.

Return to [q-triage](../q-triage/SKILL.md) when resolution changes outcome, ownership, public
contract, migration, acceptance, or verification strategy. Otherwise report the repaired head and
let the issue protocol resume its merge-lean or manual-risk delivery. This mode creates no
lifecycle artifacts, roadmap updates, or Archive work.
