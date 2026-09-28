# Delivery Metrics

Definitions for the ledger's timestamps and counters and the delivery record's inline metrics.
Record timestamps in UTC ISO 8601. Never infer or backfill a missing fact: `unknown` with its reason
is a valid value, and `pending` marks an observation window that is still open.

## Timestamps

- **Started:** the first durable ledger timestamp after `q-spec` is invoked.
- **Spec approved, Plan approved:** the first approval; amendments are events and never overwrite
  it.
- **Reconcile prepared:** Prepare has proved and published the approved parent artifacts, recorded
  sibling-work and runtime ownership, and created the isolated workspace at the exact fork OID.
- **Implementation started:** Implement verified the prepared workspace and began work.
- **Implementation ready:** coherent implementation is committed with its proportional local
  evidence and code-quality pass recorded; failures and omissions stay evidence, never green.
- **Candidate published:** the exact implementation head is published as the one ready candidate
  with its marker and actual evidence.
- **Merged:** the host's authoritative merge time: GitHub's `mergedAt`, or the local merge commit's
  committer date.
- **Archive started:** the Archive session's durable start.
- **Archive prepared:** the delivery record and the exact active-directory deletion are committed on
  the local parent and their documentation checks pass.
- **Archive completed:** the `q-archive-complete:v1` record's timestamp (the pull request comment's
  creation time, or the local completion commit's committer date), written only after the archive
  commit is on the parent, published when the host publishes, and the roadmap projection succeeds.

Derived durations:

- **Total flow to merge:** Started to Merged.
- **Paused before merge:** explicit intervals before Merged waiting on user decisions or an external
  prerequisite.
- **Unpaused flow to merge:** Total flow to merge minus Paused before merge; not model compute time.
- **Implementation flow:** Implementation started to Implementation ready, including any Plan
  return.
- **Reconcile preparation:** Plan approved to Reconcile prepared.
- **Integration latency:** Candidate published to Merged.
- **Post-merge Archive latency:** Merged to Archive completed.

## Counters

- **Green milestones:** coherent implementation commits that passed their targeted checks before
  commit.
- **Planning agent launches:** supporting planning agents actually started; direct phase-owner
  sessions are not launches.
- **Implementation agent launches:** supporting implementation agents actually started.
- **Independent review launches:** read-only supporting reviewers actually started, including
  per-slice reviewers.
- **Slice review findings:** per-slice findings the owner accepted, and hand-backs reporting
  `compacted: yes`; compare with final-review findings to judge whether slice review catches drift
  earlier.
- **Risk-gate repairs:** fresh manual-risk repair agents started on the `riskGate` route.
- **Plan revisions:** approved amendments after the first Plan approval.
- **Verification command reruns:** repeated runs of the same verification command after its first
  run, excluding an explicitly documented transient retry.
- **Steering:** user feedback that changes or clarifies scope, behavior, or workflow after work
  begins.
- **Rework:** a previously green committed slice reopened for a missed requirement or defect.
- **Discarded attempts:** manual-risk attempts removed after their one risk-gate repair could not
  make the work safe.

## Usage evidence

Record every session, including the phase owner, any coordinator, workers, reviewers, repairs,
retries, and failed launches: one row per session or attempt with stable ID, role, route,
timestamps, outcome, and usage source.

- Capture input, cached input, cache-write, output, and reasoning tokens when the provider exposes
  them, plus any reported cost, and the source's scope: per request, cumulative session, or unknown
  snapshot.
- Missing categories are `unknown`, never zero; a subscription session without reported cost is not
  free. Cached and reasoning tokens may be subsets of other counters: keep provider definitions and
  never count a subset twice. Sum disjoint requests or use the final cumulative total, never both.
- Capture native usage totals when each session completes, before provider logs rotate. When a
  session changes model or effort, attribute disjoint request totals or cumulative deltas to each
  segment; never price the whole history at the final route.
- Keep list-price or credit estimates separate from actual subscription consumption; only an
  observed usage-limit measurement supports an allowance claim. A route that cannot export complete
  totals leaves its cost `unknown`, never parity; missing accounting blocks a cost conclusion, not
  an otherwise useful quality observation.
- Separate elapsed implementation and review time, command time, user or external waits, and total
  flow. Record command reruns with their reason and matching tree and environment.
- Deduplicate review findings by root cause, keeping severity, evidence, disposition (accepted,
  rejected, duplicate), and whether the reviewer found something the owner and the deterministic
  gate missed.
- Record maintainability feedback and escaped defects from the first 14 days after delivery; an
  incomplete window is `pending`, and no available feedback is `unknown`.

Begin trend analysis only after three completed deliveries share a schema, and label cohorts when
schemas differ. Launch counts, no-op rates, and fewer lines alone never establish improvement.
