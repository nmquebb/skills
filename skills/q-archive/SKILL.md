---
name: q-archive
description: "Archive merged q full-lifecycle deliveries on the parent branch: delivery record with inline metrics, active-artifact removal, roadmap archival, and an idempotent completion record. Runs after merge from Reconcile, from automation, or by explicit invocation."
license: MIT
disable-model-invocation: true
---

# Q Archive

Archive is passive post-merge bookkeeping. Read the project configuration and addenda per
[config](../q-workflow/references/config.md), the Archive and authority sections of
[lifecycle](../q-workflow/references/lifecycle.md), [metrics](../q-workflow/references/metrics.md),
[archive format](references/archive-format.md), [artifacts](../q-workflow/references/artifacts.md),
the [integration backend](../q-workflow/references/backends/integration.md) for
`integration.host`, and, when a roadmap is configured, [q-roadmap](../q-roadmap/SKILL.md).

Callers: Reconcile Integrate continues into Archive when `archive.trigger` is `after-merge`; an
external job runs it in a throwaway checkout when it is `automation`; direct explicit invocation is
always valid. Never make Archive a precondition for merge. Before writing, confirm the effective
`archive.publish` is valid for the effective `integration.host`, including inferred ones, per
[config](../q-workflow/references/config.md#valid-combinations); stop on an invalid pair.

## Select pending work

A delivery is archivable when its merge carries exactly one lifecycle marker:

```text
<!-- q-lifecycle:v1 slug=<slug> policy=<merge-lean|manual-risk> -->
```

- `github`: a merged pull request whose body carries the marker, whose base is the recorded parent,
  with an unambiguous retained head and merge commit reachable from `<remote>/<parent>`.
- `local`: the landing commit on the parent (the merge commit, or the squash commit) whose message
  carries the marker line.

Work is pending when `<paths.work>/<slug>/` still exists on the parent, or the delivery record exists
but the roadmap update or the `q-archive-complete:v1` record is incomplete.

In an automation run, process pending deliveries oldest first, scanning all recent merges rather
than trusting the triggering event, so a later run recovers a missed or failed one. The archive's own
publication may retrigger the job; an already complete delivery is a no-op.

Stop on a malformed marker, duplicate slug ownership, an unmerged candidate, an executable conflict,
or unrelated working-tree changes. Record the failure and leave delivered code untouched for retry.

## Recover authoritative evidence

Bring the clean working branch to the current parent: fetch and fast-forward the local parent when
it is checked out here, otherwise reset the caller's throwaway branch to `<remote>/<parent>`. Read the
merged Spec, Plan, ledger, candidate body, checks, reviews, retained head, merge commit, the
`q-reconcile-complete:v1` record, and the roadmap item. The host and Git own merge facts; record
failed, skipped, pending, waived, or missing evidence as it is, never as green.

If `<paths.work>/<slug>/` is gone, recover the approved artifacts from the retained head or merge
history. Before writing, reuse a matching `<paths.deliveries>/<slug>.md` instead of creating a second
record. Verify the candidate and merge identity, unique slug ownership, marker, and exact paths before
recovery. Contradictory identity, a duplicate owner, a malformed marker, an unsafe slug, or an
unrelated working-tree change stops the item without deletion or guessed overwrite.

Archive never reruns implementation verification, asks an exit interview, resolves product feedback,
changes executable files, reopens the candidate, creates an issue, or makes a delivery decision.
Preserve unresolved follow-up and `[manual-issue]` notes as durable context for a later explicit
workflow.

## Write the archive commit

Create or finish one `<paths.deliveries>/<slug>.md` per the reference: delivered outcome, important
decisions, material Plan differences, candidate and merge identity, policy, actual verification,
known follow-up, and inline metrics. Leave historical records unchanged.

Remove exactly `<paths.work>/<slug>/`, only when its ownership matches the selected merge, in the
same commit as its delivery record. When the roadmap backend is `local`, include its update in the
same commit. Touch no executable file or unrelated active artifact. Keep Archive-owned Markdown
within the project's Markdown conventions and run `git diff --check`; these checks validate records
only and do not duplicate the delivery gate.

Commit `docs: archive <slug>` on the working branch, then publish per `archive.publish`:

- `direct`: fetch again; if the parent advanced, rebase only this unpublished Archive-owned commit
  onto `<remote>/<parent>` and revalidate the exact path set, stopping on conflict. Push the explicit
  ref normally (`git push <remote> HEAD:refs/heads/<parent>`), never by force. If a protection rule
  rejects it, keep the local commit, record the rejection on the merged pull request, and stop;
  recommend `archive.publish: pull-request` for a protected parent. Publishing this archive as a
  pull request instead needs the user's explicit direction.
- `pull-request` (GitHub only): push the commit on `archive/<slug>` and open one
  documentation-only pull request titled `docs: archive <slug>`, reusing an open one for that branch.
  It carries no lifecycle marker. Merge it under merge-lean when host rules allow; otherwise leave it
  for the user. The archive counts as published only once that merge is proved on
  `<remote>/<parent>`; until then record the pending projection and stop.
- `local`: keep the commit on the local parent; push only when `integration.push` is `true`.

A publication failure leaves the local commit recoverable and does not affect the merged delivery.
From here on, the archive commit means the commit as it landed on the parent (a squash-merged
archive pull request lands a new OID).

## Finish external projections

After the archive commit is on the parent, and published when the host publishes:

1. when a roadmap is configured, use `q-roadmap` to add durable Spec, Plan, candidate, and Archive
   references, set the item to Done, archive it, and preserve the remaining relative order;
2. if the roadmap write fails, report the pending projection and retry it on the next run without
   rewriting the archive commit; and
3. write exactly one `q-archive-complete:v1` record where the integration backend puts it (a pull
   request comment for `github`; a separate `docs: complete archive <slug>` commit appending the
   block to the delivery record for `local`), keyed by merge commit and archive commit:

```text
<!-- q-archive-complete:v1 -->
Lifecycle archive complete.
- Slug: <slug>
- Merge commit: <full OID>
- Archive commit: <full OID>
- Archive: <durable reference>
- Metrics: <durable delivery-record reference to its Delivery metrics section>
- Roadmap: archived | not configured
```

Query existing records first and reuse an exact match after retry. A completion record is valid only
after the roadmap projection succeeds or no roadmap is configured; until then the delivery stays
pending with no record. Its timestamp is the Archive completion time and the endpoint for
post-merge Archive latency.

In automation, use the job's repository credentials for repository and candidate operations. When
they lack Projects access, use a separately provisioned credential for roadmap commands only, and
never print or persist either credential.

Report the merged candidate, merge and archive commits, durable references, roadmap result, and
completion record. No phase follows Archive unless the user explicitly invokes
[q-feedback](../q-feedback/SKILL.md) or [q-improve-skills](../q-improve-skills/SKILL.md).
