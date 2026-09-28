# Q Lifecycle

The lifecycle is opt-in: enter it only when the user explicitly invokes a lifecycle phase or asks
for the q lifecycle. Ordinary build, fix, refactor, review, and investigation requests stay in the
normal agent workflow. `q-adversarial`, `q-threat-model`, and `q-triage` are explicit-only
utilities, not lifecycle phases; the Feedback and Improve phases run only when invoked. After
opt-in, plain-language directions such as "continue," "skip that," "merge it," "pause," or "stop q"
suffice.

Every phase reads the project configuration and addenda per [config](config.md), including
`.agents/q/workflow.md` when present. Before completing any delivery, lifecycle or ordinary, answer
each configured [delivery check](config.md#delivery-checks) and make its required change in the
same delivery.

## User authority

The workflow supplies defaults; it does not outrank the user.

- Follow explicit direction about scope, agents, models, verification, retries, phase transitions,
  merge timing, pauses, and stopping, within platform safety and permission boundaries.
- State a material tradeoff once, record the decision, and proceed. Do not re-ask an answered
  question.
- Declined work is closed scope unless materially new evidence identifies an undeclined critical
  security or data-loss boundary.
- Verification is evidence, not ceremony. Record failures and unknowns accurately, but do not hold
  ordinary work merely to make every check green; the owner accepts the merge-lean default and may
  revert a defective integrated change.
- Never call a failed or waived check green, bypass a host or branch-protection rule, overwrite
  unrelated work, or infer permission for force-pushes, broad cleanup, or destructive data
  operations.

## Phases

| Phase | Skill | Exit |
| --- | --- | --- |
| Spec | `q-spec` | Outcome, boundaries, acceptance, and material decisions are approved. |
| Plan | `q-plan` | A compact decision-sufficient implementation plan is approved. |
| Reconcile: Prepare | `q-reconcile` | The approved work has an isolated branch and workspace based on the current parent. |
| Implement | `q-implement` | The implementation is committed, proportionally checked, and published as one ready candidate. |
| Reconcile: Integrate | `q-reconcile` | The exact candidate head is merged or deliberately discarded, and owned resources are cleaned up. |
| Archive | `q-archive` | After a merge, the durable record, metrics, roadmap archival, and active-artifact cleanup are complete. |
| Feedback | `q-feedback` | Feedback is captured or the owning phase is resumed. |
| Improve | `q-improve-skills` | Approved skill or project-workflow changes and proportional validation are committed. |

A ready candidate is one ready pull request for `integration.host: github` and the recorded,
clean implementation head with its delivery summary for `local`; see the
[integration backend](backends/integration.md) for the host.

Archive is post-merge bookkeeping. With `archive.trigger: after-merge`, Reconcile Integrate
continues into it; with `automation`, an external job runs it. It never blocks Implement or
Integrate; a failed attempt leaves delivered code on the parent and resumes independently.

## Delivery policy

Default toward integration, not review queues.

- Publish no progressive or failed draft. Publish one ready candidate only once the implementation
  is coherent with recorded local evidence.
- Every full-lifecycle delivery uses that candidate as a short-lived delivery envelope and the
  Archive trigger. Ordinary work follows `merge-lean`: Reconcile may merge the exact candidate head
  without another user approval and without waiting for green CI.
- Use `manual-risk` only when the change crosses an undeclined high-consequence boundary:
  authentication or authorization, session or cookie semantics, tenant or account isolation,
  uploads, secrets, payments or billing, destructive data or schema changes, ordering-sensitive
  durable state, a broad external or public contract, an identified threat-model control, any
  boundary in `risk.boundaries`, or an explicitly requested review. Never choose it for diff size,
  dependency changes, reviewer preference, theoretical completeness, a failed check alone, or
  general caution.
- Before handing a manual-risk candidate to the user, launch one fresh agent on the
  [`riskGate` route](orchestration.md#roles) in the isolated implementation workspace to diagnose
  and repair the concrete risk or failed evidence. It may make one bounded repair and rerun the
  affected proof. Do not create a review task from work the gate still considers unsafe or cannot
  make coherent.
- If that bounded pass cannot make the work safe, report the outcome under
  [Decision Questions](decision-questions.md) as options with one recommendation, naming each
  option's cost and the consequence of waiving: a bounded user-authorized repair as a Plan amendment
  when the fix is already plannable, discard through Reconcile, or an explicit waiver. Do not launch
  another repair worker without explicit user authorization; the gate is not an invitation to
  retry. On discard, close any unmerged pull request, discard the task-owned branch and workspace
  through Reconcile, and append one brief ledger note naming what was attempted, the failure
  evidence, what was discarded, and a suggested issue outcome. Do not file the issue automatically.

Merge-lean failures follow the readiness rule under
[Implementation and verification](#implementation-and-verification); a concrete critical security
or data-loss failure changes the route to manual-risk. Configured host rules still apply; never
bypass them administratively.

## Active artifacts

Keep in-progress full-lifecycle work under `<paths.work>/<slug>/`. Repository Markdown is
authoritative; [artifacts](artifacts.md) owns the `spec.md`, `plan.md`, and `ledger.md` roles,
durable links, markers, and roadmap projection. When `roadmap.backend` is not `none`, load
[`q-roadmap`](../../q-roadmap/SKILL.md) before each roadmap read or write. Roadmap writes follow
durable repository facts; an unavailable roadmap update never rolls back integrated code.

From Reconcile Prepare until merge, the implementation branch owns the ledger; after merge, the
parent owns it until Archive replaces the active directory with `<paths.deliveries>/<slug>.md`.

## Planning

Make the Plan decision-sufficient, not implementation-complete: settle the outcome, owners, public
contracts, migrations, meaningful milestones, and verification that materially protects the
behavior. Leave ordinary syntax, nearby task-local files, and convention-settled choices to
implementation.

Record one delivery policy: `merge-lean` by default, or `manual-risk` with the exact
high-consequence boundary or user request that justifies it. Return to Plan only when evidence
changes an approved outcome, owner, public contract, migration, milestone boundary, or verification
strategy.

Plans name the current guides the delivery must update and state whether an ADR is required or
`none`; Implement completes that before readiness. Archive writes the delivery record after merge
but never repairs current guidance or creates an ADR. Every Plan carries the answer to each
delivery check forward; a yes names the required change among the guides and files to update.

## Implementation and verification

Use one accountable implementation owner for a cohesive full-lifecycle delivery in the prepared
workspace. The owner maintains the ledger, reviews and commits each slice, and handles delivery.
Where the host can launch fresh-context agents, the owner hands every coherent slice to a fresh
worker that reads the applicable guidance before editing, so the owner never carries long edit
context across compaction (conventions decay there); otherwise the owner implements each slice
itself under the re-grounding protocol. Keep the same owner across related milestones and bounded
repairs. Lightweight and ordinary work stay direct. Select each slice's worker route by its
uncertainty and consequence; preserve explicit user choices.

Follow the [re-grounding protocol](../../q-code-quality/references/code-style.md#re-ground-before-editing)
at every slice and after compaction or resume. Read the approved outcome and relevant raw sources;
use the ledger's current-state section for decisions, evidence, and next action instead of
replaying its history.

For a behavior change or gap-driven bug fix, load [q-tdd](../../q-tdd/SKILL.md) before
implementation. Keep its red and green evidence in the active ledger or issue.

Obtain one fresh independent final review per lifecycle delivery; it owns the sole complete-diff
quality verdict. Review earlier when a wrong contract, trust-boundary decision, migration, or state
transition would invalidate dependent work; the Plan names that boundary. The manual-risk gate stays
required. A separate candidate scout is optional for a broad review, a measured experiment, or a
user request; record its unique confirmed findings and cost.

Beyond default slice delegation, delegate only for a concrete contribution: a large independent
investigation, coherent mechanical batch, deliberate context recovery, or disjoint implementation
with settled contracts. Parallel writers need explicit file/owner boundaries and one integration
owner; otherwise slices run sequentially. Launch no worker/reviewer pairs for publication or other
mechanically checkable state. Summaries and scout candidates are navigation, not verdicts.

Search existing owners and call sites before creating logic, per
[code retrieval](../../q-code-quality/references/code-retrieval.md). Run cheap lint feedback early,
useful seam checks during implementation, and one proportional readiness pass:

1. format task-owned supported files and run the project's format check and lint;
2. run affected typecheck, test, integration, smoke, or browser evidence that materially proves
   acceptance; broad changes may justify the full typecheck and test suite;
3. inspect the complete task diff and repository status; and
4. obtain the independent final review and its [q-code-quality](../../q-code-quality/SKILL.md)
   verdict.

The implementation owner owns execution evidence: exact tree/commit, commands, environment, results,
and logs. Reviewers judge acceptance and code first, then reconcile prior diagnoses. Reuse
trustworthy evidence for the same tree and environment; reproduce it when missing, invalidated,
suspicious, or insufficient. Review challenges behavior and design rather than repeating the test
matrix. After a correction, rerun affected evidence and re-review its impact.

Correct newly introduced lint/type failures before readiness or record an explicit user waiver.
Pre-existing failures and unavailable noncritical checks or infrastructure are disclosed merge-lean
gaps, not blockers. Never weaken checks. CI owns the complete build unless acceptance or a changed
build boundary needs local proof.

Record every agent and retry, including owner and coordinator sessions, in the ledger per
[metrics](metrics.md). Judge review stages by confirmed unique findings and total delivery cost,
not launches, test counts, or minimum diff sizes.

## Workspaces

The control checkout is the clone that owns the parent branch. With `git.workspace: worktree`,
Reconcile Prepare creates one plain-Git worktree per delivery under `git.worktreeRoot`; with
`branch`, the implementation branch is checked out in the control checkout, which then must stay
clean between phases.

- Resolve every workspace, branch, process, container project, and database from recorded identity,
  never from a similar-looking name or the current directory alone. Stop on zero or several
  plausible matches.
- Record, before starting anything, each resource a delivery owns and its exact stop or removal
  command. Never copy secret values into records.
- Clean only exact recorded resources: task processes, task-owned container projects, the
  implementation worktree, and implementation refs whose expected OID still matches. Restore a
  reused parent runtime and database only from recorded ownership. Never broadly prune Git,
  containers, worktrees, branches, or volumes.
- Every automation declares the branches, workspaces, and other artifacts it creates and who removes
  them; an automation without that declaration is a review defect.

Launcher-specific workspace rules, such as registering a worktree with an agent orchestrator, live
in the [launcher reference](orchestration.md#launchers).

During a full-lifecycle run, deliver new user direction to the active implementation owner,
preserve its exact wording in the ledger, and propagate it to an active child when relevant.
Steering never grants a worker independent delivery authority or turns an unquoted decision into a
waiver.

## Integration

After implementation is coherent:

1. require task-owned changes committed and no unrelated changes in the implementation workspace;
2. publish the ready candidate through the [integration backend](backends/integration.md) for
   `integration.host`, never by force, carrying the
   `<!-- q-lifecycle:v1 slug=<slug> policy=<merge-lean|manual-risk> -->` marker, durable Spec and
   Plan references, delivery policy, outcome, material risk, local evidence and gaps, and cleanup
   ownership; and
3. move the roadmap item to In review when a roadmap is configured; that write is not a merge
   prerequisite.

Reconcile Integrate runs from the control checkout. It fetches current state, reconciles parent
drift on the implementation branch without rewriting history, and proves the exact base, head, and
merge identity.

For `merge-lean`, merge the current head immediately with the configured method and the host's
exact-head guard. Record current check results for disclosure; do not wait, request another
approval, or turn a non-critical failure into a draft. For `manual-risk`, require the current-head
risk-gate pass, all expected checks green, settled actionable review, and explicit user approval of
that head before merge. A head change invalidates only manual-risk evidence that materially depends
on the old head.

After the merge, prove it with the backend's merge proof, then clean only exact recorded resources.
Leave `<paths.work>/<slug>/` on the merged parent; it is Archive's queue.

## Lightweight issue delivery

Use this lane only for one issue carrying one approved `q-triage:v1` block. It creates no Spec,
Plan, lifecycle ledger, delivery record, roadmap item, or managed lifecycle workspace.

Triage sets the issue to `ready`. Implement claims it with `inProgress`, works from the configured
issue branch, runs proportional evidence and the code-quality pass, and publishes one ready
candidate that closes the issue, never a failed draft. Ordinary issue work merges under
`merge-lean`; review is the exception. Load [q-tdd](../../q-tdd/SKILL.md) when the issue changes
behavior or fixes a behavior gap, and preserve the red and green evidence on the issue.

If the triage block identifies a manual-risk boundary, run the same bounded risk gate before
handing the ready candidate to the user. If the gate cannot make it safe, close the unmerged
candidate, discard the branch, record the failure evidence on the issue, and leave it `blocked`;
the source issue already owns the work, so create no new issue or ledger.

Status values mirror queue state; they do not expand mutation authority. An `inProgress` issue
without an approved `q-triage:v1` block is someone's direct work; automation leaves it untouched.

## Feedback and deferred work

Ordinary feedback does not block merge-lean delivery. Capture settled steering in the active ledger
or issue. Preserve unsettled lifecycle follow-up in the delivery record; do not turn it into an
issue unless another explicit workflow grants that action.

When review feedback arrives on a lifecycle candidate that has a live implementation owner, send the
grouped feedback to that owner instead of pushing to a branch another workspace holds; the owner
makes the correction and the handled reply. Treat one candidate and current head as the work item
and handle its complete unhandled comment set in one correction batch.

An undeclined critical security or data-loss finding is never silently deferred: it takes the
manual-risk repair-or-discard route or an explicit user waiver.

## Communication

Lead with the concrete state: implemented, ready, merged, discarded, or archived. Distinguish passing
evidence from recorded gaps. Report a blocker as cause, consequence, and the known resolution
options with their costs plus one recommended default, never a bare terminal stop; the user decides.
End with one user action only when one is required. Present those options, and every other decision
the user must settle, under [Decision Questions](decision-questions.md).

When the next phase has a configured owner route the current session does not match, name the route
and give a fenced, copyable prompt for a new session. Start it with the host's skill invocation
(`/q-plan` in Claude Code, `$q-plan` in Codex, `/skill:q-plan` in pi), and include the concrete
artifact path and the next phase or resume point. Honor explicit user route overrides and existing
approvals; the prompt grants no approval or routing change. For example, after Spec approval:

```text
/q-plan Continue from the approved spec at docs/work-in-progress/<slug>/spec.md; read the sibling ledger.md for settled decisions and current state.
```

## Authority

Ordinary work still requires a separate request to push or merge. Opting into the lifecycle
authorizes its normal implementation-branch publication, merge-lean exact-head merge,
ownership-scoped cleanup, and post-merge Archive writes described here and in the integration
backend. `manual-risk` still requires explicit approval of the exact head before merge. None of
these authorize administrative bypass, force-push, history rewriting, unrelated deletion, broad
cleanup, or destructive database confirmation.

Automation dispatched against an approved issue may claim and update that issue, push its exact
branch, publish its one ready candidate, merge an ordinary exact head, update status, and leave
evidence on that issue or candidate. It may not mutate the roadmap, lifecycle artifacts, another
issue, or another branch. Review automation may inspect, comment, and prepare or push a correction
on a lifecycle candidate, but never closes, merges, or discards it or deletes its branch; that
disposition belongs to the user and the delivery's owning phase.
