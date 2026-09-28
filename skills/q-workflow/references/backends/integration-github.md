# GitHub Integration

The candidate is one non-draft pull request against the recorded parent. Pass `--repo <owner/name>`
explicitly on every `gh` call and send bodies from a temporary file outside the repository. GitHub
and Git are truth; fetch before every decision.

## Operations

| Operation | How |
| --- | --- |
| **publish** | Push the reviewed head (`git push <remote> <branch>`, setting upstream on first push); `gh pr create --repo <repo> --base <parent> --head <branch> --title "<title>" --body-file <file>`, or `gh pr edit` for the existing one, stopping on several matching pull requests or a conflicting closed-unmerged one; then commit the ledger transition (pull request reference, reviewed head, timestamp) and push it. The pull request follows its branch |
| **inspect** | `gh pr view <n> --repo <repo> --json number,url,state,isDraft,baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus,statusCheckRollup,reviewDecision,mergedAt,mergeCommit` |
| **sync-parent** | In the implementation workspace: `git fetch <remote>`, `git merge <remote>/<parent>`, resolve, run affected evidence, commit, `git push <remote> <branch>` |
| **merge** | `gh pr merge <n> --repo <repo> --merge --match-head-commit <head>` (`--squash` or `--rebase` per `integration.mergeMethod`) |
| **prove** | See [Merge proof](#merge-proof) |
| **record** | A pull request comment carrying the completion marker |
| **discard** | `gh pr close <n> --repo <repo> --comment "<pointer to the ledger or issue note>"` |

Fill `.github/pull_request_template.md` when it exists, keeping its sections and adding the
[candidate body](integration.md#candidate-body) content.

Never force-push, use `--admin`, or pass `--delete-branch`; Reconcile deletes refs itself after
proof. If repository rules reject the merge, report their exact result and retain every resource.
If the harness denies the merge command, stop with the exact `gh pr merge` command and head, retain
every resource, and resume from this checkpoint when re-invoked; record the wait as a pause, not a
failure.

## Merge proof

When a merge queue or auto-merge defers the merge, the delivery stays pending until `mergedAt` is
set; record the wait and resume Integrate at this proof. After GitHub reports the merge, fetch
again.

- **`merge`:** the retained pull request head is an ancestor of the merge commit, and the merge
  commit is an ancestor of `<remote>/<parent>`.
- **`squash` or `rebase`:** `mergedAt` is set, `headRefOid` equals the inspected head, and
  `mergeCommit` is an ancestor of `<remote>/<parent>`. The branch is no longer an ancestor of the
  parent, so delete refs only by expected OID, never by ancestry.

Delete the local branch only after that proof (`git branch -d` for `merge`; for other methods,
`git branch -D` only when its head equals the proved pull request head). Delete a surviving remote
branch with an expected-OID lease:
`git push --force-with-lease=refs/heads/<branch>:<head> <remote> :refs/heads/<branch>`.

## Completion records

Post or update one pull request comment per marker. Query every existing comment first
(`gh api --paginate repos/<repo>/issues/<n>/comments`; a single page silently hides older ones),
match the marker and the merge or archive identity exactly, and edit that comment in place
(`gh api -X PATCH repos/<repo>/issues/comments/<id> -F body=@<file>`). The comment's `created_at`
is the durable timestamp for that checkpoint.

## Media

Media is best-effort context, not a gate. When the work already opened a browser, simulator, or
rendered UI, or the user or Plan asks for media, attach a representative screenshot or short
recording to the pull request body or a comment when the installed `gh` supports attachments.
First check each frame for secrets, bearer URLs, personal or customer data, and irrelevant browser
chrome. Never open UI solely for media unless asked, and never commit capture files. If attachment
fails, continue text-only unless media was explicitly requested.

## Durable links

Link a committed, remotely published file by full commit OID, showing the short OID in the link
text:

```text
https://github.com/<owner>/<repo>/blob/<full-oid>/<repository-relative-path>
```

A branch name, `HEAD`, an unpublished commit, or an uncommitted path is not durable evidence.
