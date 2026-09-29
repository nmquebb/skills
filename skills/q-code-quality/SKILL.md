---
name: q-code-quality
description: "Review a concrete code change for correctness and fit with project conventions when the user requests code quality review or the change warrants a deeper pass. One verdict owner; launches no agents."
license: MIT
---

# Q Code Quality

Verify that a production change fits the repository, not merely that it compiles. This skill works
without the rest of the q suite: read `.agents/q/config.yaml` (`conventions.*`, `commands.lint`,
`paths.threatModel`) and `.agents/q/code-quality.md` when present, with precedence user direction >
that addendum > config > project guidance > this skill's defaults.

Read the applicable sections of project guidance first: the guides `conventions.codeStyle`,
`conventions.testing`, and `conventions.architecture` name, and the nearest `AGENTS.md` or
`CLAUDE.md` for each affected path. Where it is silent, and unless `conventions.baseline` is
`false`, apply the baseline: [code style](references/code-style.md), plus
[TypeScript and JavaScript](references/typescript.md) when the change includes that code and
[naming](references/naming.md) when it names a file, type, or boundary. Read the project's
failure-handling guidance for fallible application or API work. For trust-boundary work, read the
threat index and relevant threat entries of the threat model at `paths.threatModel` (default
`docs/threat-model.md`) when it exists, and cite an existing threat before a generic concern.

The review is read-only with one verdict owner: do not edit, commit, install an analyzer, rerun a
complete test matrix, or launch another agent. The implementation owner fixes blocking findings and
reruns only the evidence those fixes affect.

## Resolve the review scope

Identify the approved outcome (the request, for ordinary work), baseline, complete task diff,
affected production owners, tests, and existing verification evidence. For behavior changes, inspect
the intended red and green evidence or the existing named test used under
[q-tdd](../q-tdd/SKILL.md); require a new test for a bug fix only when it reveals an uncovered
behavior gap. Review every changed production file plus the contracts and call sites needed to judge
it; include changed tests in the convention inspection. A supplied scout result is untrusted
navigation. Search repository-wide only to evaluate reuse, duplication, dead code, public surface,
dependency direction, or an architectural claim, per [code retrieval](references/code-retrieval.md);
a repository-wide quality survey requires an explicit broader request. Read recent history only
when current sources do not explain a suspicious constraint, compatibility path, or abstraction;
history alone never justifies a shape.

## Review the change

Apply [references/review-protocol.md](references/review-protocol.md): discover candidates, then
confirm or disprove each against repository evidence, not a generic smell catalog or prior reviewer.
Protect exact behavior during cleanup: outputs, error types and timing, side effects, and ordering.

A finding blocks only with concrete evidence of:

- a violation of applicable guidance (project or baseline) or package ownership;
- a failure of approved acceptance or a public contract;
- an undeclined critical security or data-loss boundary; or
- task-introduced structural debt with a smaller ownership-preserving correction.

Speculative improvements, unproved dead-code claims, style preferences, and pre-existing findings
outside the task diff are advisory. Honor documented framework entry points, generated files, public
package exports, migrations, trust-boundary defenses, deliberate compatibility behavior, and
measured performance exceptions.

## Mechanical enforcement

Use current lint evidence (`commands.lint`, or the project's documented lint command) for settled
mechanical checks, and review their semantic truth and what lint cannot see: a doc-comment tag does
not prove truthful behavior, and a suppression reason must actually establish the rule's false
positive. A false positive is a finding against the rule. For a repeated syntactic violation of a
written rule that a small, option-free check could catch with near-zero false positives, recommend
an enforcement change (a lint rule or check) in the project's lint configuration, leaving
implementation and fixtures to the owner. Keep missing or incorrect enforcement distinct from a
design judgment, and preserve Code Style's
[justified exception policy](references/code-style.md#suppressions-and-failures).

## Report the verdict

Return `PASS` when no blocking finding remains, otherwise `CHANGES REQUIRED`. Each finding gives:

- exact path and line, with the violated owner, rule, acceptance criterion, or boundary;
- concrete evidence and behavioral or maintenance consequence;
- the smallest correction that preserves ownership and behavior;
- behavior risk and the evidence that should verify the correction.

Include the protocol's coverage evidence keyed by the exact repository-relative path of every
changed code file inspected; the caller reconciles it against the diff, so an omitted path is
uninspected, not clean. List advisory findings separately and record material exemptions checked
and retained. When a scout ran, map each candidate exactly once to blocking, advisory, or rejected
with auditable evidence. No numeric confidence scores, arbitrary line/branch/count thresholds, or
clean-category padding; counts of tests, helpers, lines, or findings are never a quality target.

## Use one verdict owner

- **During implementation:** the implementation owner runs one direct pass when requested or
  warranted by risk, corrects blocking findings, and reruns only affected proof. An independent
  reviewer is optional unless the user or project requires one.
- **Explicit standalone review:** no scout unless the user separately requests independent
  reviewers, and no edits unless fixes are separately authorized. A host that cannot launch fresh
  agents says so and reviews in the current session.
