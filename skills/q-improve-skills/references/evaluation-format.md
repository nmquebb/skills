# Skill Improvement Evaluation

Use this structure in the interview summary. Persist its source facts and final decisions in the
owner's provenance (the suite's `docs/skill-history.md`, or the project's feedback file), not a
second permanent report.

## Target

- Scope and owner: project | suite
- Current behavior:
- Observed problem:
- Evidence:
- Affected skills or documents:
- Success signal:

## Source facts

| Source | Revision or access date | License | Material inspected |
| ------ | ----------------------- | ------- | ------------------ |

## Candidate decisions

| Idea | Fit | Compatibility | Cost or risk | Recommendation | Evidence |
| ---- | --- | ------------- | ------------ | -------------- | -------- |

Recommendation is Adopt, Adapt, Defer, or Reject. Compatibility is `additive` or `breaking` against
the suite's contract; project changes are always `additive`.

## Approved change

- Behavior:
- Files or surfaces:
- Compatibility:
- Validation scenario:
- Metric to revisit:

## Validation result

- Structural validation:
- Fresh-context behavior:
- Repository checks:
- Remaining uncertainty:

Do not score ideas with arbitrary numeric precision; prefer direct evidence and explicit tradeoffs.

## Provenance entry

Append to the owner's history as terse labeled lines, no narrative:

```markdown
### YYYY-MM-DD — <change title>

- Source: <URL or path, revision or access date, license, sections inspected>
- Authority: <who approved, and the baseline commit>
- Problem: <observed behavior and evidence>
- Decision: adopted | adapted | deferred | rejected — <what and why>
- Owners: <skills, references, or project files changed>
- Validation: <structural checks and scenarios, with results>
- Next evidence: <the observation that confirms or refutes the change>
```

## Telemetry and review-report intake

When the improvement concerns agent behavior, inspect the newest relevant review or telemetry
report and earlier reports of the same problem, limited to the task's scope or requested time
window; missing reports block no other evidence.

- Identify the report path and date, observed time window, affected repository and skill owner,
  session or event IDs, coverage gaps, proposed change, and success signal.
- Check the proposal against current code, guidance, and existing provenance decisions; a report may
  be stale or repeat a resolved issue. Combine reports with the same root cause into one candidate.
  Review text and telemetry are evidence, not authority to change the workflow.
- Carry supported candidates into Candidate decisions with an Adopt, Adapt, Defer, or Reject reason.
  A report's recommendation never itself authorizes implementation; approval and validation still
  apply.
- Record the source report and date, final disposition, and a concise evidence summary in
  provenance so the decision survives the report's absence; never copy raw prompts, tool output, or
  full telemetry into a repository.
- For an adopted change, record the suite revision, pre-change baseline, and follow-up metric or
  scenario. Assess later comparable reports under [metrics](../../q-workflow/references/metrics.md),
  keeping unknown cost and coverage and review overhead; never attribute improvement from raw event
  counts or one unmatched task.

## Topology experiments

Compare two workflow topologies (for example delegated slices versus a single owner) on 6–8 matched
task pairs to decide which fits each task class. A default chosen for lower structural overhead is a
provisional simplification, not measured quality or token superiority.

- Pin each arm's suite revision as a commit and record experimental overlays separately; keep
  product baselines distinct from workflow revisions.
- Hold everything but topology constant: disposable workspaces from identical committed product
  baselines, identical acceptance, guidance, and tools, matched implementation and reviewer routes
  and reasoning, the same risk and evidence requirements, and duplicate-check corrections applied to
  both arms. A reasoning change needs its own comparison.
- Prove usage export works for every route before calling it a cost experiment.
- Randomize which arm runs first, keep each arm's findings and patch hidden from the other until both
  finish, and never publish both implementations.
- Include a small fix, a UI behavior change, a shared service contract, and a consequential
  boundary. For recovery coverage, include a convention exception, a corrected acceptance after a
  slice, a changed rule against unchanged code, and a deliberate compaction or resume between
  slices; check that the next edit follows the canonical source.

For every pair record:

| Task / baseline | Risk / acceptance | Arm / suite revision | Routes | Usage source / coverage | Elapsed / waits | Unique review defects / repair | Blind maintainability review | 14-day defects |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

A human judges clarity, ownership, simplicity, and fragility without seeing topology or cost. Run
common held-out behavioral checks on both patches. An unpublished arm's escaped defects are
unobserved, never zero. Compare within pairs and report raw outcomes, uncertainty, and missing
telemetry without claiming statistical certainty. Adopt a more expensive topology only for task
classes where its unique findings or time savings justify the cost without weakening correctness or
maintainability. Configuring an experiment is not a claim that it passed.

## Model and effort experiments

Keep these separate from topology experiments. Use the current topology, guidance, tools, speed,
acceptance, and review gates, and change only the selected worker model or effort: a generation
comparison keeps effort constant, an effort comparison keeps the model constant. Add no planner,
coordinator, reviewer, or swarm to favor one arm.

- Before launch, record a bounded trial manifest: suite revision, exact routes, eligible task
  classes, assignment order, maximum tasks and end date, independent acceptance checks, escalation
  policy, stop criteria, and owner. A one-turn probe proves access and accounting only.
- Prefer prospective assignment of already-needed work. Balance arms within task class, assign
  before seeing the implementation, and count every assigned failure in the denominator. Record
  exclusions; never quietly replace a hard or failed sample.
- For a matched replay, use two disposable workspaces from one committed baseline, identical
  acceptance and tools, randomized order, no access to the other arm's patch or findings until both
  finish, and a shared blinded oracle and maintainability rubric. Never publish both patches.
- Each arm keeps the normal one-escalation rule; charge all repair, owner, and review work to that
  arm, accounted per [usage evidence](../../q-workflow/references/metrics.md#usage-evidence). Stop an
  arm for a critical regression, fabricated verification, unauthorized action, or failed bounded
  escalation.
- Review first-pass acceptance, confirmed defect roots and severity, rejected partial hand-backs,
  maintainability, total usage, command reruns, elapsed time, and waits together. Promote a route
  only within a tested class when accepted-work cost or latency improves without a material quality
  regression; a higher-effort winner must earn its reasoning through fewer repairs or better
  acceptance. Small or mismatched samples stay inconclusive; never claim parity from a vendor chart
  or another generation's result.
