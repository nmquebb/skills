# Evals and Hillclimbing

Use an eval when the target is behavior that recurs and can be checked: a skill loading on the
right requests, a reviewer catching a class of defect, a phase stopping at the right question, or a
role's cost at unchanged quality. An eval is a set of cases, graders, and arms (host, model, effort)
run headlessly with repeats. It complements delivery records and prospective
[experiments](evaluation-format.md#model-and-effort-experiments), which stay the evidence for what
offline cases cannot observe: escaped defects, maintainability, and real waits.

In the suite's source checkout, `evals/README.md` documents the harness and its suites; a project
keeps its own suites, which carry its code and history, outside the suite.

## Build

- **Cases from real work.** Draw inputs, in order, from delivery records and ledgers, confirmed
  review findings and escaped defects, pending feedback, and a handful of hand-written cases;
  synthesize only to fill gaps, anchored to those. Include clean controls and requests that should
  not trigger. Never select cases because the current model fails them: that measures one model's
  blind spots, not the work.
- **Graders.** Prefer programmatic checks of artifacts, markers, Git state, commands run, and skills
  loaded. For judgment, write checkable claims, one fact each, never a rating scale, and have a
  model from a different family than the arm under test judge them. Before trusting a grader, grade
  a sample of transcripts by hand, re-grade identical outputs to confirm the verdict holds, and
  confirm that a known-good and a known-bad output grade as expected.
- **Isolation.** Start every trial from a fresh workspace built from a committed fixture, with no
  state from earlier trials, and pin host, model, and effort explicitly rather than inheriting them
  from the session. Keep expected answers and graders out of the workspace.
- **Health.** A useful eval scores higher with a stronger model or more effort, leaves headroom (the
  strongest arm well below 95%), and repeats consistently. A case every arm fails is usually
  ambiguous or misgraded; investigate it before tuning anything. Count infrastructure failures
  (timeouts, rate limits, the wrong model answering) apart from scores.
- **Noise.** Report each case's pass rate over its repeats, with intervals resampled over cases.
  Before tuning, confirm the interval is narrower than the smallest change worth acting on;
  otherwise add cases or repeats.

Show the user the cases and a pilot's graded transcripts before a full baseline, and state the
baseline's size and expected usage before running it.

## Hillclimb

1. Fix the goal before the first round: quality, or cost or latency within a quality band stated in
   advance.
2. Split the cases once, at random and stratified by kind, into train and test. Never re-split to
   rescue a result.
3. Each round, read only train transcripts, find the root cause of one failure class, and make one
   targeted change to one surface: a skill's wording or description, an addendum, or a route's
   model or effort. Never paste case content, transcripts, or project specifics into suite text.
4. Run train and test against the baseline. Keep the change only when train improves and test
   improves too; a train gain that test does not show suggests overfitting, and any regression
   reverts it.
5. After two or three rounds without a gain beyond noise, sort the remaining train failures by root
   cause: a content gap, a grader or case bug, a harness failure, a structural limit, or variance.
   Fix graders and cases openly and re-run the baseline; stop when no single change could beat the
   noise.
6. Report the test delta against the baseline with its interval. A gain inside the noise is no
   evidence for the change.

Treat a route change as a pair of arms on the same cases: the current route and the candidate.
Choose a cheaper route for a task class only when quality stays inside the stated band, and a more
expensive one only when it earns its cost through fewer misses or repairs.

## Record

In the owner's provenance, record the eval (suite, cases, split, repeats, arms, skills revision),
the baseline and final results with their intervals, usage, and the decision. Transcripts stay
outside the repository.
