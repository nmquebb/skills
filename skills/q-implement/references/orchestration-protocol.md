# Full-Lifecycle Implementation Ownership

Use this for approved Spec and Plan work in the prepared workspace; ordinary and lightweight work
stay direct. [Lifecycle](../../q-workflow/references/lifecycle.md) owns authority and review;
[orchestration](../../q-workflow/references/orchestration.md) owns roles, routes, and launchers.

## Resolve the owner

The invoking session owns delivery when it is in the prepared workspace on the configured
`implementationOwner` route, or an approved user or Plan override, or when no owner route is
configured. Otherwise launch one implementation owner there through the launcher and keep it across
milestones and repairs.

Where the host can launch fresh agents, this sole coordinator writes no slice code: it launches one
fresh-context worker per coherent slice, reviews the hand-back, and commits. Where it cannot, the
owner implements each slice itself under the re-grounding protocol, records the topology as
`single-owner (no subagents)`, and records the slice reviews it performs itself as self-review. The
independent final review stays required: when the host cannot start it, stop before publication
with the choices in [Routing rules](../../q-workflow/references/orchestration.md#routing-rules).
Use each agent's exact configured route; if it is unavailable, inspect launcher support and report
the fallback, never silently substituting a user-selected model.

Give workers explicit ownership, the accepted contract, source pointers, and a bounded result. They
must preserve others' edits and coordinate shared owners. Parallel writers need settled contracts
and an integration owner; large read-only investigations may run independently while the owner
progresses. Do not delegate routine lexical navigation.

Record owner and child identities, routes, boundaries, and expected contributions. Use completion
notifications, not polling. Send user steering verbatim to the owner and affected child; do not
restart an owner when a child or slice finishes.

## Keep one continuous goal

On hosts with goal tools (such as Codex), the owner inspects the current goal before implementation.
Reuse it only when it already covers this delivery's Implement exit or the user is resuming that
exact blocked goal. With no unfinished goal, create one with this objective: deliver the approved
Plan through committed implementation, proportional checks, independent final review, one ready
candidate, and handoff to Reconcile. Set no token budget unless the user supplied one. If an
unrelated unfinished goal exists, do not replace or broaden it: stop Implement, report the conflict,
and name resolution of that exact goal as the resume condition.

Keep the goal active across slices, child completions, commits, and bounded repairs; give concise
progress updates when useful. Mark it complete only at the actual Implement exit. Hosts without goal
tools, and lightweight work, stop only when delivered, durably blocked with a resume condition, or
directed by the user.

Diagnose a failed command or operation before retrying it. Use at most the one bounded
[escalation](../../q-workflow/references/orchestration.md#escalation); never add speculative
abstractions, widen scope, or repeat the whole task to keep the goal moving. Surface a failure that
needs new user authority without manufacturing retries. On a goal-capable host, mark the goal
blocked only when the same blocking condition has persisted for three consecutive goal turns (the
initial user-triggered turn or an automatic continuation while the goal is active) and no
meaningful progress is possible without user input or external change. Report the exact evidence,
implementation owner, recovery owner when different, resume condition, resolution options, and
recommended option.

When a manual-risk result, final-review `BLOCKED` verdict, or another first-turn condition needs a
user decision before that threshold, ask once and leave the goal unfinished for the response. Do not
manufacture continuations or mark blocked early. Follow an explicit user stop or replacement. Never
call incomplete, difficult, or merely uncertain work blocked.

## Work in coherent slices

Follow the [re-grounding protocol](../../q-code-quality/references/code-style.md#re-ground-before-editing)
before each slice and after compaction, resume, or handoff. The ledger's current-state section names
acceptance, relevant decisions and exceptions, current tree and commit, evidence, and the next
action. Read the authoritative sections it points to and the actual code and callers; do not reload
every historical entry or treat another agent's summary as proof.

### Fresh-context slice workers

Launch one fresh worker per coherent slice with no inherited transcript, on the worker route the
slice class selects (`worker`, `workerNarrow`, `workerComplex`, or `workerUi`). Run slices
sequentially unless ownership is disjoint and contracts are settled. The launch prompt gives this
bounded contract as source pointers, not copied guides, full ledgers, prior transcripts, or raw
command logs:

- outcome: the Plan milestone text, the ledger's current state, and the accepted contracts and
  decisions it depends on;
- ownership: paths the worker may change, owners it must reuse, and what it must not touch;
- guidance to read before editing: the nearest nested `AGENTS.md` for each owned path; the
  project's code-style guidance and the suite [baseline](../../q-code-quality/references/code-style.md)
  in full (unless `conventions.baseline` is `false`); the
  [naming](../../q-code-quality/references/naming.md) and project naming guidance when naming a
  file, type, or boundary; applicable architecture sections; the project's failure-handling
  guidance for fallible work; relevant threat-model controls from `paths.threatModel`; and the
  [code-quality skill](../../q-code-quality/SKILL.md) and its review protocol for the required
  read-only pass;
- checks: affected typecheck and tests, the project's lint and format check, then re-read the code
  style in full and run a read-only code-quality pass over every changed function in full before
  hand-back;
- size: finish within one context. If the slice outgrows it, stop at a coherent point and hand back
  the completed part and the remainder rather than working on through compaction; and
- limits: no commit, push, ledger edit, further agent, or scope beyond the slice.

The worker returns one hand-back: guidance read as exact paths; source-specific coverage keyed by
every changed path; commands, results, tree, environment, and log paths; `compacted: yes|no`;
deviations and open questions. Return a missing guidance list or coverage to the same worker. The
hand-back is navigation until the owner inspects the diff.

After each hand-back, the owner:

1. re-reads the code style in full, then inspects the complete slice diff with its Review test;
2. launches one fresh read-only slice reviewer on the `sliceReviewer` route with the slice contract,
   the slice diff, and the guidance paths above. It reads the code style in full and the
   code-quality review protocol, reviews every changed function in full, and returns findings with
   locations and the violated rule, never a verdict. A `compacted: yes` slice is unreviewed until
   this review covers it;
3. sends accepted findings to the slice worker as a bounded correction and re-inspects the result;
4. reuses the worker's lint and format-check evidence after verifying its tree, environment, and
   results, and reruns only missing, stale, suspicious, or insufficient evidence (this does not
   waive the pre-publication checks);
5. commits coherent task-owned work and records the worker's and reviewer's identities, routes,
   usage, and accepted findings in the ledger; and
6. closes or archives the worker and reviewer after recording their evidence.

Keep a bounded correction of a committed slice with the worker that wrote it while it is available;
otherwise launch a fresh worker with the same contract. For new behavior, load
[q-tdd](../../q-tdd/SKILL.md) and retain the intended red and green evidence. When tests are added
to protect existing behavior, where no red observation of missing behavior is possible, the owner
proves each distinct claim can fail: temporarily break the committed baseline behavior it protects,
observe the failure, and restore the exact source. Group claims only when the oracle stays
independent. Reviewers never mutate code.

Beyond the slice review, review a consequential contract or state transition before implementing
dependent work. Before readiness, confirm the Plan's named current-guide updates, ADR disposition,
and delivery-check changes are complete; Archive promotes no guidance and creates no decisions.
Return to Plan only when its approved outcome, owner, public contract, migration, milestone
boundary, or verification strategy changes.

## Obtain independent final review

After readiness evidence, launch one fresh read-only reviewer on the `finalReviewer` route with
acceptance, baseline, full task diff, applicable source locations, and machine-produced evidence
tied to the current tree and environment. It forms its own view before earlier diagnoses. Prefer a
different model family when the route fits; diversity alone does not prove correctness.

A scout is optional for a broad review, a user request, or a recorded workflow experiment. Give it
one bounded discovery question; it returns candidates with locations and evidence, never a verdict,
and does not duplicate the test gate. The final reviewer confirms or rejects supplied candidates and
independently reviews the complete diff. Record unique confirmed findings and usage so the stage can
be evaluated.

The final reviewer applies [q-code-quality](../../q-code-quality/SKILL.md) once as the sole quality
verdict owner. It reuses trustworthy execution evidence, repeating commands only when missing,
stale, suspicious, or insufficient, and actively challenges caller-visible behavior and design.
Paste the exact contents of [implementation-verdict.schema.json](implementation-verdict.schema.json)
into its prompt (a path alone produces malformed verdicts). Require one JSON object:

- `READY`: acceptance, proportional evidence, and complete-diff quality are satisfied, with disclosed
  merge-lean gaps accurately identified. Publication is the owner's next action.
- `CONTINUE`: concrete authorized correction, affected boundary, and necessary evidence.
- `BLOCKED`: cause, owner, exact resume condition, and resolution options with costs and one default.

`coverage` lists every changed code path the reviewer inspected as exact repository-relative paths.
Before accepting `READY`, reconcile it against `git diff --name-only <baseline>..<head>` excluding
documentation and generated files. A changed path missing from `coverage` is uninspected, and the
same reviewer completes it as bounded follow-up; a `READY` whose coverage does not reconcile is not
accepted, whatever its summary says.

The owner fixes concrete findings, reruns affected evidence, and requests review of the correction
and its affected consumers. Reuse the reviewer for bounded follow-up; start a fresh one when scope or
context warrants. Ask the same reviewer once to re-emit malformed JSON before reporting a workflow
failure. No arbitrary retry ladder or per-finding validators.

The parent skill's manual-risk gate stays independent and bounded. Confirm its repaired boundary
before proceeding without another complete review when current final-review evidence covers it.
Record waivers exactly and preserve the gate's user-decision contract.

## Publish and retain evidence

After `READY` and any required risk result, verify branch identity, task-owned clean status,
committed head, publication result, candidate state, and published head directly with Git and the
host. Publish the one ready candidate and hand off under the recorded delivery policy. Publication
never starts another worker and reviewer pair. A moved head invalidates only the evidence its diff
affects; reconstruct before relying on earlier results.

Record meaningful ledger deltas with the next task commit or final transition commit. Preserve
historical launch counters and capture all sessions, retries, review dispositions, and usage under
[metrics](../../q-workflow/references/metrics.md#usage-evidence). Once a child's identity and
evidence are durable, close or archive disposable children without touching the user-facing owner.
Stop only when delivered, durably blocked with a resume condition, or directed by the user; a
routine wait or completed child, slice, or milestone is not terminal, so never ask the user to say
continue there.
