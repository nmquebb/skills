# Delivery Record Format

Archive writes this one record for every merged full-lifecycle delivery, regardless of delivery
kind. It never creates an ADR or updates current guidance.

```markdown
# <Delivery title>

## Delivery status

- Delivery policy: merge-lean | manual-risk — <reason when manual-risk>
- Candidate: [#<number>](<URL>) from `<head branch>` into `<base>` | local merge of `<branch>` into `<parent>`
- Delivered head: <full retained head OID>
- Merged: <host merge UTC timestamp>
- Merge commit: <full OID>
- Archive prepared: <UTC timestamp>
- Deployment: pending | <identifier and timestamp>
- Specification baseline: <full OID>
- Approved Plan: <full OID>
- Delivery commits: <range or concise list>
- Suite revision: <q skills revision in use, from skills-lock.json, the plugin, or unknown>

## What was delivered

## Architecture and behavior

## Important decisions

## Differences from the plan

## Verification

Record commands, checks, running-app evidence, failures, omissions, and waivers exactly as observed.

## Reconciliation and cleanup

- Implementation branch: <branch>
- Workspace cleanup: <completed, retained, or unknown exact state>
- Runtime cleanup: <completed, retained, not applicable, or unknown exact state>
- Roadmap: not configured | <item reference and post-merge projection state>

## Follow-up

None. | <unsettled feedback, accepted deferral, or `[manual-issue]` scheduling note>

## Delivery metrics

- Started: <UTC timestamp>
- Spec approved: <first approval UTC timestamp>
- Plan approved: <first approval UTC timestamp>
- Reconcile prepared: <UTC timestamp>
- Implementation started: <UTC timestamp>
- Implementation ready: <UTC timestamp>
- Candidate published: <UTC timestamp>
- Merged: <host merge UTC timestamp>
- Archive started: <UTC timestamp>
- Archive prepared: <UTC timestamp>
- Archive completed: `q-archive-complete:v1` record timestamp
- Deployed: pending | <UTC timestamp>
- Total flow to merge: <Started to Merged duration>
- Post-merge archive latency: derived from the Archive completion record
- Paused before merge: <duration>
- Unpaused flow to merge: <Total flow to merge minus Paused before merge>
- Planning agent launches: <count>
- Implementation agent launches: <count>
- Independent review launches: <count>
- Slice review findings: <accepted count; compacted hand-backs count>
- Risk-gate repairs: <count>
- Plan revisions: <count>
- Verification command reruns: <count>
- Steering: <count>
- Rework: <count>
- Discarded attempts: <count>
- Topology: <single-owner | single-owner (no subagents) | delegated>
- Usage evidence: <all session and attempt IDs and source references; include owner and retries>
- Tokens and reported cost: <provider-defined totals, coverage, or unknown with reason>
- Implementation, review, and check time: <observed durations and wait intervals>
- Unique review findings: <accepted severity and root causes, rejected and duplicate counts>
- Maintainability feedback: <blind review result or unknown>
- Escaped defects: <14-day observation window and outcomes, pending until complete>

## Current guidance and decisions

None. | <links to current guides updated during Implement and any accepted ADR>
```

Omit empty narrative sections, but always keep Delivery status, Verification, Reconciliation and
cleanup, Follow-up, Delivery metrics, and Current guidance and decisions. The final section is
`None.` when the Plan named no current-guide updates and no ADR, otherwise links only. Never guess
deployment or cleanup facts.

Write terse bullet fragments, not narrative. Each narrative section holds only facts a later reader
needs (typically three to six bullets); link an ADR or guide instead of restating it. Verification
names each command or check with its observed result, not its log. Omit process chatter, retry
stories, and workspace IDs once cleanup is confirmed.

`Archive completed` and its latency come from the completion record because a commit cannot contain
its own OID or publication timestamp. With `local` integration, Archive appends the record to this
file in a separate completion commit, once:

```markdown
## Archive completion

<!-- q-archive-complete:v1 -->
- Slug: <slug>
- Merge commit: <full OID>
- Archive commit: <full OID of the archive commit on the parent>
- Archive: <durable reference to this record at the archive commit>
- Metrics: <durable reference to its Delivery metrics section>
- Roadmap: archived | not configured
```

The completion commit's committer date is the completion time. Recorded facts (identities,
timestamps, results, metrics) never change; prose may be condensed. `## Follow-up` is the
append-only section for post-delivery feedback, and `## Archive completion` is written once by
Archive.

Field semantics follow [metrics](../../q-workflow/references/metrics.md); preserve provider counter
semantics and missing-data reasons.
