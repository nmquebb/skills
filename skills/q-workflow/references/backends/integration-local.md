# Local Integration

No pull request: the candidate is the clean implementation branch plus its delivery summary, and
Reconcile merges it in the control checkout. Git is truth. Nothing is pushed unless
`integration.push` is `true` and a remote exists.

## Operations

| Operation | How |
| --- | --- |
| **publish** | Commit the transition that records the [candidate body](integration.md#candidate-body) and the [reviewed head](integration.md#reviewed-head-and-candidate-head): a `## Delivery summary` section in the ledger (lifecycle), or a log entry in the issue's final candidate commit (issue lane). Push the branch only when `integration.push` is `true` |
| **inspect** | The candidate head is `git rev-parse <branch>`; check the range since the reviewed head as the [integration contract](integration.md#reviewed-head-and-candidate-head) requires; `git merge-base --is-ancestor <parent> <branch>` shows drift |
| **sync-parent** | In the implementation workspace: `git merge <parent>` (after `git fetch` when a remote exists), resolve, run affected evidence, and commit; the merge becomes part of the candidate |
| **merge** | From the control checkout on a clean parent: see [Merge](#merge) |
| **prove** | See [Merge proof](#merge-proof) |
| **record** | See [Completion records](#completion-records) |
| **discard** | Record the discard note; there is no candidate to close |

## Merge

Require the parent checked out and clean, the parent an ancestor of the candidate head (run
**sync-parent** first when it is not), and the branch head equal to the inspected head. Then land
it in one commit that carries the delivery's identity in its message body, on its own line:

- lifecycle work: `q-lifecycle:v1 slug=<slug> policy=<policy>`, which Archive scans for;
- issue lane: `Issue: <issue reference>`; never a GitHub closing keyword.

By `integration.mergeMethod` (`rebase` is not available for local integration: it leaves no single
landing commit to carry the identity or prove the merge):

- **`merge`** (default): `git merge --no-ff -m "<subject>" -m "<identity line>" <branch>`.
- **`squash`:** `git merge --squash <branch>`, then one commit with the same message.

Manual-risk work merges only after the user approves that exact head. When `integration.push` is
`true`, push the parent normally afterwards; a rejected push leaves the local merge in place and is
reported, never forced.

## Merge proof

Because the parent was an ancestor of the candidate head, the landing commit's tree equals the
candidate head's tree: require `git rev-parse <landing>^{tree}` to equal
`git rev-parse <candidate head>^{tree}`, and for `merge` also the candidate head as the landing
commit's second parent. Then delete the local branch (`git branch -d <branch>` for `merge`; for
`squash`, `git branch -D` only when its head still equals the proved candidate head) and a pushed
remote branch with an expected-OID lease, as in the GitHub backend.

## Completion records

- **Reconcile:** when Archive runs in the same session (`archive.trigger: after-merge`), carry the
  `q-reconcile-complete:v1` facts straight into the delivery record. Otherwise append them to the
  active ledger on the parent in one commit, `docs: record <slug> integration`.
- **Archive:** after the archive commit is on the parent and any roadmap projection succeeded,
  append the `## Archive completion` section from the
  [delivery record format](../../../q-archive/references/archive-format.md) to the delivery record
  in a separate commit, `docs: complete archive <slug>`. It references the archive commit's fixed
  OID, and its committer date is the Archive completion time. The record is complete only when its
  marker and every field match this delivery. When its slug, merge commit, or archive commit
  differs, stop: the section belongs to another identity and is never overwritten. After proving
  the identity fields match, repair a missing or wrong reference or roadmap field in place; never add
  a second section.

When `integration.push` is `true`, push the parent normally after each record commit and confirm the
remote contains it; a rejected push leaves the record pending for the next run, never forced.

## Durable references

Reference a committed file by path and full commit OID, showing the short OID:
`docs/work-in-progress/<slug>/spec.md @ 1a2b3c4d`. A branch name, `HEAD`, or an uncommitted path is
not durable evidence.
