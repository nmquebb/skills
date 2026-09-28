# GitHub Tracker

Issues live in `tracker.repo` (default: the `owner/name` of `git.remote`). GitHub is truth. Pass
`--repo <owner/name>` on every `gh` call, and send every body from a temporary file outside the
repository.

## Operations

| Operation | How |
| --- | --- |
| **resolve** | `gh issue view <number-or-url> --repo <repo> --json number,url,state`; a URL fixes the repository |
| **read** | `gh issue view <n> --repo <repo> --json number,title,body,state,labels,url,closedByPullRequestsReferences`, plus every comment with `gh api --paginate repos/<repo>/issues/<n>/comments` |
| **write-contract** | Build the full new body, `gh issue edit <n> --repo <repo> --body-file <file>`, then fetch again and require the preserved original content and the exact approved block |
| **set-status** | `gh issue edit <n> --repo <repo> --add-label "<new>" --remove-label "<old>"` with the [configured labels](#labels) |
| **note** | `gh issue comment <n> --repo <repo> --body-file <file>`; edit a keyed note with `gh api -X PATCH repos/<repo>/issues/comments/<id> -F body=@<file>` |
| **link** | `Closes #<n>` in the delivering pull request body when the pull request lives in `tracker.repo`; `Closes <owner>/<repo>#<n>` when it lives elsewhere. With `integration.host: local` there is no pull request: add a **note** naming the branch and reviewed head, and **close** the issue after the merge is proved |
| **close** | Merging the linked pull request closes it; otherwise `gh issue close <n> --repo <repo> --comment "<reason>"` |
| **create** | `gh issue create --repo <repo> --title "<title>" --body-file <file>` |

Use `gh api -F body=@<file>` or `--body-file`; `-f body=@<file>` posts the literal path. Fetch after
every write and compare before reporting success. If a later step fails after a correct write,
report the partial state and resume at the failed step without rewriting the matching content or
re-requesting approval.

## Labels

| Status | Default label | Color | Description |
| --- | --- | --- | --- |
| `proposed` | `triage: proposed` | `FBCA04` | Triage proposal awaiting approval. |
| `questions` | `triage: questions` | `D876E3` | Triage needs answers before approval. |
| `ready` | `ready for implementation` | `0E8A16` | Approved triage contract; ready for implementation. |
| `inProgress` | `in progress` | `1D76DB` | Implementation in progress. |
| `inReview` | `in review` | `5319E7` | Ready candidate awaiting review. |
| `blocked` | `blocked` | `B60205` | Blocked; see the latest issue comment. |

`tracker.labels.<status>` overrides a name. Before the first write of a status, check
`gh label list --repo <repo>`. Create a missing label only with the defaults above, and only after
setup approval or the user's approval of the operation that needs it. Reuse an existing label
without changing its color or description.

## Asynchronous approval

When automation dispatches triage instead of an interactive chat, or the user asks for approval on
GitHub, present the proposal as one issue comment delimited by `<!-- q-triage-proposal:v1 -->`
markers, containing the complete drafted block and any unresolved decision frontier.

- Add the comment's database ID and a lowercase `sha256` digest of the proposal payload between the
  markers as the lines `Proposal comment ID: <id>` and `Proposal digest: sha256:<digest>`.
- Compute the digest over exactly this input: take the text between the markers, normalize line
  endings to LF, drop the two metadata lines, strip leading and trailing whitespace from what
  remains, then append exactly one `\n`. Producer and consumer both use this normalization; any
  other computation is a defect in the computing side, not a malformed proposal.
- Creation may post once and then immediately edit the same comment after GitHub assigns its ID. On
  revision, edit that comment in place and recompute the digest instead of posting another. After
  every post or edit, fetch the comment and require both markers and a matching digest before
  labeling.
- Apply `questions` while the frontier is non-empty, otherwise `proposed`.
- Approval is a later comment, created after the proposal's latest edit, that clearly approves the
  current proposal, from an approver: by default a person whose `role_name` in
  `gh api repos/<repo>/collaborators/<login>/permission` is `admin`, `maintain`, or `write`, or the
  approvers the triage addendum names instead. Find it with
  `gh api --paginate repos/<repo>/issues/<n>/comments`; bots and the proposal's own author (when it
  is automation) never approve. Any intervening proposal edit invalidates it.
- At finalization, fetch both comments again by ID (`gh api repos/<repo>/issues/comments/<id>`),
  recompute the digest, re-verify the approver's permission, and record the proposal database ID,
  digest, and approval-comment database ID in the approved block. Never write the issue body or
  apply `ready` before valid approval; at finalization remove the `proposed` or `questions` label.
