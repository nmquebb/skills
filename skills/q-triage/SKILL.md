---
name: q-triage
description: "Investigate and plan one tracker issue into an approved q-triage contract and ready status, for GitHub issues, local Markdown issues, or a custom tracker. No implementation, roadmap, or lifecycle artifacts. Explicit invocation only."
license: MIT
disable-model-invocation: true
---

# Q Triage

Turn one issue into an executable contract. Read the project configuration and addenda per
[config](../q-workflow/references/config.md), the relevant
[lifecycle](../q-workflow/references/lifecycle.md) sections, the project's code-style and
architecture guidance (`conventions.codeStyle`, `conventions.architecture`, else the
[baseline](../q-code-quality/references/code-style.md)), and guidance nearest the affected code.
Perform every tracker step through the [tracker backend](../q-workflow/references/backends/tracker.md)
for `tracker.backend`.

This lightweight alternative to Spec and Plan does not enter the full lifecycle, create lifecycle
artifacts, update metrics or the roadmap, launch supporting agents, or implement the result.

## Resolve the issue

Require one explicit issue reference, or an explicit request to file a new issue: then
**create** it and triage that exact issue. **Resolve** the reference to exactly one issue; the
tracker is truth. **Read** its title, description, state, status, comments or log, and linked
candidates, then inspect the current branch, commit, status, applicable documentation, existing
logic, call sites, tests, and relevant history, following
[code retrieval](../q-code-quality/references/code-retrieval.md). Stop on an ambiguous repository
or issue identity. Retriage a closed issue only on explicit user instruction.

Preserve all issue content outside the one `q-triage:v1` block the
[tracker contract](../q-workflow/references/backends/tracker.md#the-triage-block) defines. Zero
blocks means first triage; one block may be revised after another approval. Never edit multiple or
malformed blocks automatically.

## Investigate and decide

Search existing behavior and owners before proposing new logic. Separate repository facts, user
decisions, and inference. Read primary external sources only when a current external fact
materially affects the issue.

Ask one complete frontier, under [Decision Questions](../q-workflow/references/decision-questions.md),
for unresolved choices that change the user outcome, scope, ownership, public contract,
compatibility, migration, failure behavior, verification value, or material risk. Never ask the
user to settle repository facts or repeat decisions already in the issue or conversation.

Include each configured [delivery check](../q-workflow/references/config.md#delivery-checks) that
repository evidence does not settle. When an answer is yes, the Actionable plan names the required
change and Verification names its evidence.

Choose `merge-lean` by default; use `manual-risk` only for a boundary in
[Delivery policy](../q-workflow/references/lifecycle.md#delivery-policy) or explicit user review,
recording the exact trigger. Diff size, dependencies, general caution, or a verification command
alone never qualify.

Classify the branch with one type: `feature` (new product behavior), `fix` (defect or regression),
`chore` (documentation, refactoring, tests, dependencies, tooling, or CI), or `release` (release
preparation only). Build the branch from `branches.issue` with a concise lowercase kebab-case
outcome slug, for example `feature/GH-13-export-invoices-csv` or
`fix/issue-7-rounding-on-refunds`. Treat the classification as a material choice only when the
issue does not select one unambiguously.

## Approve and update

Draft a proportional block with this contract:

```markdown
<!-- q-triage:v1:start -->
## Triage

- Status: approved
- Approved at: <UTC timestamp>
- Baseline: <full commit OID inspected>
- Parent branch: <branch>
- Implementation branch: `<branch from branches.issue>`
- Delivery policy: merge-lean | manual-risk — <exact trigger when manual-risk>
- Approval source: `interactive` | `GitHub proposal <comment-database-id> at sha256:<digest>` | <a source the project's triage addendum defines>
- Approval comment: `interactive` | `<GitHub comment database ID>` | `none`

### Findings

<Current behavior, root cause or gap, relevant owners, and evidence.>

### Scope

<Concrete outcome and owned boundaries.>

### Non-goals

<Explicitly excluded work.>

### Acceptance criteria

- <Observable outcome>

### Actionable plan

1. <Ordered implementation step with its owner and important reuse.>

### Verification

- `<Targeted command or observable check>`
<!-- q-triage:v1:end -->
```

For a behavior change, make the uncovered claim, relevant failure modes, and intended red and green
evidence actionable under [q-tdd](../q-tdd/SKILL.md). Name an existing protecting test when one
already covers the behavior; do not prescribe a new test for every fix.

Make the plan decision-sufficient, not implementation-complete; include contract, data-flow,
compatibility, migration, failure, and risk decisions only when applicable. Every acceptance
criterion maps to a plan step or verification item. Known paths are evidence, not an exhaustive
allowlist.

Present unresolved decisions and the complete proposed block together, then obtain explicit user
approval (a clear approval of the displayed proposal suffices) before changing the tracker. With
the GitHub tracker, when automation dispatched triage or the user asks to approve on GitHub, use
the
[asynchronous approval](../q-workflow/references/backends/tracker-github.md#asynchronous-approval)
protocol instead; with another tracker, automation reports the proposal and stops until the user
approves it in a session. Never write the contract or set `ready` before valid approval.

**Write-contract**: replace only the single existing block or append the first block after the
original content; never overwrite the original description, comments, or unrelated sections.
**Read** again and require the preserved original content and the exact approved block.

**Set-status** to `ready`; on GitHub, ensure the label exists per the
[label rules](../q-workflow/references/backends/tracker-github.md#labels). Read again and require
both the preserved content and the status before declaring Triage complete. If the status write
fails after the contract write, report the partial state and resume at the status step without
rewriting the matching approved block or re-requesting approval. With the local tracker, commit the
issue file per the [local tracker](../q-workflow/references/backends/tracker-local.md#commits-and-branches).

Report the issue reference and branch name, then name [q-implement](../q-implement/SKILL.md) with
that issue as the next action. Never create the branch, commit code, push, or publish a candidate
from Triage.
