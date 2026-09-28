# Integration Operations

How a finished implementation becomes part of the parent branch. Skills name these operations; the
backend for `integration.host` says exactly how: [github](integration-github.md) or
[local](integration-local.md).

| Operation | Contract |
| --- | --- |
| **publish** | Push the exact implementation branch normally (never force) when the host needs it, create or update the one ready candidate with its body and marker, and commit the ledger or issue transition that records it |
| **inspect** | Fetch the candidate's current base, head OID, checks, review state, and merge state |
| **sync-parent** | Merge the fetched parent into the implementation branch without rebasing, run affected evidence, and republish |
| **merge** | Merge the exact inspected head with `integration.mergeMethod` and the host's exact-head guard |
| **prove** | Prove the merge landed the inspected head on the parent |
| **record** | Write the idempotent completion record for Reconcile or Archive |
| **discard** | Close an unmerged candidate with a pointer to the ledger or issue note |

## Reviewed head and candidate head

The **reviewed head** is the commit the final review (or the issue lane's quality pass) judged. The
transition commit that publishes the candidate records it; no record ever holds its own commit's
OID. The **candidate head** is always the implementation branch's current head, observed from Git
or the host.

Before merging, inspect `git diff --name-only <reviewed head>..<candidate head>`. Commits that touch
only the delivery's ledger, active artifacts, or issue file need nothing more. Any other change
invalidates the evidence it affects, per
[Implementation and verification](../lifecycle.md#implementation-and-verification).

## Candidate body

Build the body from actual evidence, stating failures and omissions plainly:

- delivered outcome and material risk;
- delivery policy and, for manual-risk, the exact trigger;
- durable Spec and Plan references (lifecycle), or `Planning contract: <issue reference>` plus
  whatever the tracker's **link** operation puts in the body (issue lane);
- local evidence with commands and results, and disclosed gaps;
- cleanup ownership: branch, workspace, and runtime the delivery owns;
- for lifecycle work, exactly one marker:

```text
<!-- q-lifecycle:v1 slug=<slug> policy=<merge-lean|manual-risk> -->
```

Never label a failed, pending, skipped, cancelled, or missing check as passing. Only a lifecycle
delivery's candidate carries the marker; an Archive documentation pull request never does.

## Completion records

Reconcile and Archive each leave one idempotent record keyed by a marker, created once and edited
in place on retry:

- `<!-- q-reconcile-complete:v1 -->`: merged head, merge commit, timestamp, delivery policy,
  disclosed check conclusions, any user-wait interval with start and end timestamps, and every
  cleaned or retained exact resource.
- `<!-- q-archive-complete:v1 -->`: slug, merge commit, archive commit as it landed on the parent,
  durable archive and metrics references, and roadmap state. It is written only after the archive
  commit is on the parent (and published, when the host publishes) and the roadmap projection
  succeeded or no roadmap is configured.

The host backend says where each record lives.
