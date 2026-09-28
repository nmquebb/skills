# Code Quality Review Protocol

## Establish the snapshot

Review the complete task diff against approved acceptance and applicable guidance. When baseline
and head are pinned, read code, guidance, generated output, and tests from those Git objects, never
newer checkout state. Report unavailable evidence as a limitation.

Code Style below means the applicable code style: the project's guides, then the
[baseline](code-style.md) where they are silent and `conventions.baseline` is not `false`. It owns
behavior preservation, reuse, abstraction, complexity, comments, types, test oracles, and the final
deletion/review tests. The project's naming, architecture, and failure-handling guidance own theirs,
with the baseline [naming](naming.md) and [TypeScript and JavaScript](typescript.md) guides where it
is silent. Load only applicable sections and local exceptions.

## Inspect maintainability before behavioral evidence

Before reading test results or earlier verdicts, enumerate the changed production and test files and
read their changed functions and surrounding module structure in full. For each multi-phase changed
function, list its operations in execution order and check that distinct phases are visually
separated under Code Style's grouping rule, keeping a short producer-and-return function together
where that exception applies. Then check definition placement and compare task-added flows with
affected sibling owners. Read shared exports and real consumers when judging a new public surface.

Keep one concise coverage entry per changed code file, keyed by exact repository-relative path so
the caller can compare it with the diff mechanically: inspected declarations, a concrete grouping or
ownership observation, and any finding or retained exception. A small related set may share an
entry only when every path and its declarations stay explicit. Paste no function bodies or clean
checklists. Reconcile coverage against the task diff before a complete-diff verdict and name any
uninspected code as a limitation.

Passing lint establishes only the rules it enforces. A convention finding needs conflicting source
structure and the applicable rule or exception, not a runtime failure. Do this within the existing
review and reuse its evidence on an unchanged tree.

## Discover, then confirm

Form an independent view of changed code and its callers before reading earlier diagnoses. A scout,
when supplied, returns candidate locations, claims, applicable rules, consequences, and missing
proof, or `none`; never a verdict.

For behavioral candidates, trace a concrete input or state through real callers to its consequence.
For convention candidates, identify the conflicting source structure and applicable rule or
exception. Confirm that the task introduced it and that the cited rule applies. Before declaring
code dead, search beyond imports for framework entry points, exports, configuration, templates,
generated registries, and dynamic use. Do not consolidate similar shapes with different meaning,
lifecycle, units, trust, or ownership.

Reject disproved, duplicate, unreachable, or preference-only claims. Reuse current lint findings
without duplicating them, but do not dismiss a convention violation merely because it looks
syntactic. Keep pre-existing out-of-scope debt advisory. Record each supplied candidate once as
blocking, advisory, or rejected. A score or absent category is not evidence.

## Trace changed seams

Follow only the risks the changed behavior exposes:

- authorization rechecked at the mutation's transaction/lock boundary;
- commit, rollback, retry, durable state, and external-I/O ordering;
- membership/resource changes through cache, loader, and navigation invalidation;
- persisted data through domain/wire shapes and supported rollout behavior;
- collection, date-range, occurrence, or database-cardinality bounds before expensive work;
- failure propagation, expected-versus-operational failure classification, and usable recovery.

For cleanup, require evidence that distinguishes a regression from preserved baseline behavior. Keep
a latent bug separate unless authorized acceptance includes its correction. Judge abstraction or
complexity with Code Style's tests at the actual ownership boundary; lower counts alone prove
nothing. Doc comments and comments must describe actual behavior even when lint validates their
shape.

## Judge the evidence

Reuse trustworthy current execution evidence. Inspect the asserted outcome and oracle under
[Tests](code-style.md#tests): a passing command is insufficient when its assertion cannot detect the
alleged defect. Check discriminating inputs, independent expected values, and the intended red/green
evidence for new behavior or the existing protecting test. Check every removed or weakened assertion
against its remaining owner under Tests. When a test backfilled onto existing behavior records a
break proof (the committed baseline temporarily broken to show the test fails, then restored), judge
that proof's relevance to the claim. Reviewers never mutate.

Ask for another command only when evidence is missing, invalidated, suspicious, or insufficient for
a concrete finding; request a correction and its affected proof, not the full test matrix.

Before prescribing a new integration test, inspect the existing harness and the changed owner's
dependencies, identify the behavioral claim needing proof, and confirm the proposed seam can
exercise it; a sibling suite alone does not establish feasibility. An unavailable harness does not
waive required acceptance; distinguish a blocking evidence gap from a preferred test implementation.

## Conclude

Apply Code Style's [Review test](code-style.md#review-test) to the final diff. State the reviewed
baseline/head and production scope, and name any uninspected portion. A bounded review is not a
complete-diff PASS; complete missing required inspection before that verdict, since passing commands
or a prior verdict cannot fill the gap. Return the
[parent skill's verdict](../SKILL.md#report-the-verdict) with only actionable findings, checked
material exceptions, and meaningful limitations. The verdict owner confirms every candidate; a prior
review or scout is navigation, not authority.
