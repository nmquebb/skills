# Code Style

The suite's language-neutral baseline. Explicit user direction, the `.agents/q/code-quality.md`
addendum, and project guidance (the guides `conventions.codeStyle` names and the nearest
`AGENTS.md`) outrank it. Its rules apply where those are silent, unless `.agents/q/config.yaml` sets
`conventions.baseline: false`, which leaves only the procedures in
[Re-ground before editing](#re-ground-before-editing) and [Review test](#review-test).
[TypeScript and JavaScript](typescript.md) and [naming](naming.md) extend it. A rule written for a
construct applies where the language has one; where a language's established naming or formatting
idiom differs, follow the idiom.

Optimize for a maintainer reading and changing the code, not for the fewest lines or the most
reusable-looking design.

## Re-ground before editing

At each slice (one reviewable outcome, not a file count or agent assignment), re-read the active
acceptance and decisions, the applicable code-style sections (project guides, then this baseline),
and the nearest `AGENTS.md` and owner guidance for the affected paths. Inspect the actual branch,
baseline, task diff, existing owner, and affected consumers. Load naming, architecture,
failure-handling, threat-model, and product/UI guidance only where the slice needs it; preserve
applicable exceptions.

After compaction, resume, handoff, or a material scope change, reconstruct these facts before the
next edit; summaries route to current sources, not replace them. Refresh conventions even without
compaction; compact only under context pressure.

At the slice boundary, read changed functions and modules in full, not only added lines, and check
grouping, definition placement, and ownership before behavioral proof. Compare repeated task-added
flows across affected apps and features while those owners are in context. Formatting and lint do
not settle these. Fix an applicable convention violation before dependent work, or keep an explicit
user waiver.

Apply the [Review test](#review-test) to the diff and report the outcome, relevant checks, and
unresolved decisions. Use an existing task record only when the project already has one.

## Simplicity

- Build only what the current feature needs; note later ideas as follow-up only when useful.
- A diff too wide for a maintainer to hold in one review is a defect; slice the work instead.
- Prefer direct code over speculative abstractions, generic frameworks, compatibility layers, or
  configuration with no present consumer.
- Do not add a helper that only renames a direct operation (a `compareStrings` wrapper around
  `left.localeCompare(right)`); call the operation directly.
- Remove a wrong early design instead of preserving it behind adapters; fix foundations directly.
- Add a dependency only when it materially simplifies owned code and fits the existing stack.
- Remove task-introduced dead imports, unreachable branches, commented-out alternatives, resolved
  TODOs, and temporary debug output.

Behavior-preserving cleanup must preserve caller-visible outputs, error types and timing, side
effects, mutation, ordering, and async behavior. Prove it with targeted tests, characterization,
type or reachability proof, or another trustworthy seam; when evidence cannot separate intended
behavior from regression, report the debt or add characterization first. Keep a latent bug found
during cleanup separate unless the approved outcome requires fixing it.

## Reuse before creation

Before adding logic:

1. Search names, concepts, exports, schemas, handlers, services, repositories, callers, and
   dependencies with the matching tool from [code retrieval](code-retrieval.md).
2. Read candidate implementations and call sites for ownership and blast radius.
3. Extend an existing owner when the behavior belongs there.
4. Add new logic only when reuse would mix unrelated responsibilities or distort a clean boundary.

Before deleting apparently unused behavior, also check package exports, configuration, scripts,
templates, generated registries, framework entry conventions, string-based lookups, and dynamic
loading. Read history only when current sources do not explain the behavior.

A helper earns its place by naming a meaningful domain operation, removing demonstrated repetition,
or isolating an external boundary, never merely by shortening one expression. Prefer local verbosity
over tiny indirections. That never authorizes copy-paste; duplication has its own promotion rule:

- A verbatim copy of a function in a second feature or package is never acceptable. At the second
  use, move it to the owner the project's architecture assigns and import it from both call sites.
- When a third feature implements the same flow shape (same states, ordering, and failure handling,
  differing only in wording or fields), extract the shape into one owner and keep feature wording at
  the call sites.
- Copying instead of promoting must be justified in review, not the default.

Deletion test for a helper, wrapper, interface, adapter, factory, registry, configuration knob, or
pass-through layer: if removing it makes complexity disappear rather than concentrate in an existing
owner or reappear across real callers, it has not earned its place. A test double may justify a
real second adapter; a ceremonial layer does not.

## Files and functions

- One cohesive responsibility per file. Split when unrelated reasons to change accumulate, not to
  meet a line count.
- Place definitions near their conceptual peers, not appended to the end of the file.
- Blank lines separate exported schemas, types, class methods, and logical chunks of a function
  body. A body of seven or more statements has at least one, and a statement directly after a
  multi-line `if`, loop, `try`, or `switch` block is preceded by one; other phase boundaries are
  review judgment.
- In a small function, keep an immediate `return` adjacent to the single statement producing its
  value; keep a blank line when it separates a multi-line operation or distinct phase.
- Prefer straightforward control flow and descriptive locals over dense expressions or point-free
  callback chains.
- Always brace control-flow bodies, even single statements.
- Keep branching shallow with guard clauses, early returns, and early `continue`. No nested runtime
  conditional expressions (a ternary inside another ternary's condition, consequent, or alternate);
  assign a descriptive local with `if` or `switch` instead. Single-level ternaries are fine.
- Use `switch` when one discriminant selects among mutually exclusive literal cases. Keep `if` for
  guards, ranges, compound predicates, and independent validations; never `switch (true)`.
- Name private fixed module-level policy primitives (limits, durations) in `SCREAMING_SNAKE_CASE`;
  public contracts, ordinary objects, functions, and runtime values keep the language's ordinary
  casing.

Cyclomatic complexity is a diagnostic: honor an explicitly configured threshold; otherwise no score
alone fails review. When a touched function's decisions, state transitions, loops, or error paths
obscure its normal flow, simplify at a real responsibility boundary with guard clauses, early
`continue`, and descriptive locals. Extract only a meaningful domain operation, existing owner, or
demonstrated reuse; do not hide branches in one-use helpers, dense expressions, lookup tables,
polymorphism, or configuration to lower a count. A complexity-focused refactor records a comparable
before/after method plus behavior-preservation evidence.

File and type names follow the project's naming guidance, then the baseline [naming](naming.md).
The project's architecture guidance (`conventions.architecture`) owns package ownership, transport
boundaries, persistence, composition, and configuration.

## Use-case flow and boundaries

- A top-level use-case operation exposes the normal flow in domain terms. Keep parsing, protocol,
  process, and persistence mechanics behind the existing owner that can hide them; add no
  pass-through controller, service, or repository layers for architectural appearance.
- Parse or normalize external, persisted, and network values once at the owning boundary, then pass
  trusted domain values inward. Use a narrow domain type or discriminated union when it prevents a
  meaningful invalid combination, not ceremonially for every primitive.
- Add exceptional-case machinery only for an approved requirement, an observed failure, or a
  documented invariant at a high-consequence security, data-loss, or concurrency boundary. Fix the
  smallest real failure at its owner instead of building retries, fallbacks, or lifecycle machinery
  for a theoretical case. Lack of a prior incident does not override a recorded threat or invariant.

Defensive code is not a defect by shape alone: keep parsing, validation, logging, and fallbacks
justified by real user, network, persistence, plugin, or deployment boundaries.

Route layout, transport indirection, and database query layout follow the project's architecture
guidance and the nearest `AGENTS.md`.

## Comments

- Explain why a decision, invariant, workaround, or ordering constraint exists, and document
  external constraints and non-obvious tradeoffs near the affected code. Do not narrate syntax or
  restate self-explanatory names.
- Comments, doc comments, and descriptive repository docs are claims to verify: trace the
  implementation and callers before relying on a material claim about current behavior. When code
  refutes it, follow the code; update or remove stale task-owned documentation in the same change,
  or, outside scope, report the discrepancy without repeating the claim. Normative guidance stays a
  requirement even when code violates it.

## Suppressions and failures

- Never suppress a lint finding (an inline disable directive or equivalent) to bypass it; fix the
  code. A suppression is acceptable only with a why-comment proving the rule is wrong for that exact
  line.
- Model meaningful domain failures explicitly. Keep internal errors distinct from wire schemas when
  transport and domain concerns differ. Expected failures follow the project's failure-handling
  guidance.

## Tests

Each executable test belongs to one kind: a kind the project's testing guidance
(`conventions.testing`) sanctions, or, where it names none, one of these:

- **User journey (browser or native app):** primary proof for user-visible behavior through a real
  browser, or a fresh simulator or device, against the running applications and an isolated real
  backend (API, workers, database, cache, storage, captured mail).
- **Real-infrastructure invariant:** a claim a journey cannot deliberately provoke, such as a
  concurrency race, tenant or account isolation, money or payment conservation, durable-work
  fencing, or trust-boundary refusal. Use the real relevant infrastructure and observable boundary.
- **Isolated test:** owned logic whose concrete success and failure modes are listed before writing
  the code. Isolate only the boundary needed to make those outcomes observable.

Choose the smallest test of the sanctioned kind that proves the claim. A user-visible journey owns
its outcome; do not repeat the same claim in each implementation layer. Keep important success and
realistic failure behavior. Do not test type-system guarantees, private helpers, library or
framework guarantees, full copy strings, query- or cache-key read-backs, configuration echoes, or
mock-call choreography without an owned observable outcome. Fake-backed races do not prove
concurrency. Add a framework only when real runtime behavior needs it, and do not expose internals
or add production options just for a test.

For a behavior change, enumerate relevant failure modes before implementation, choose its kind, and
write a test with a fixed expected outcome before production code. Run it and retain evidence that
it fails for the intended missing behavior; then implement and retain the green result. If an
existing test already protects the behavior, identify and use it instead of adding a duplicate; to
add a case beside an existing test, extend its table or fixture rather than copying it. A bug fix
needs a new test only when the bug reveals a behavior gap; write that test first and observe the
reported defect red. An unrelated setup failure or a test that changes its expectation with the code
is not red evidence. The project's testing guidance or configured `commands.test` supplies commands
and artifacts. A missing prerequisite or unavailable infrastructure is recorded as skipped with its
reason, never as a pass. Run tests against isolated test infrastructure, never a shared development
database or service.

Before removing or weakening an assertion, name the claim it protected and its remaining owner, or
the approved acceptance that retired the claim. An existing test that fails after a change is a
regression until approved acceptance changes its claim; do not edit its expectation to match. A test
that fails only because behavior-preserving code moved is asserting implementation; rewrite it at
the owning boundary.

Keep the oracle independent of the behavior it judges: the expected value, tolerance, assertion
condition, scenario generator, fixture, or fake must not flow from the same production algorithm,
helper, or realized state when one defect could move both sides together. Copying the production
algorithm into the test is not independent. Anchor the verdict in approved acceptance, an externally
fixed example, a specification-derived calculation, an independent model, a metamorphic relation, or
another observable source; computed expectations, shared helpers, and imported constants are fine
when their producer is not the thing under test. Choose inputs that distinguish intended behavior
from defaults and no-ops.

Judge a test by its assertions, not its name. A refusal or negative case must observe the reason
owned by the guard under test (its status, error code, or field) beside a control that passes the
other guards; a denial from another guard or an unreachable path proves nothing. A test must reach
the real owner it names, not a substitute store, counter, or fixture that supplies the result the
owner should produce.

Declare fixtures and helpers before the first test or after the last, never between tests; once a
file groups tests (`describe` or equivalent), put later tests inside their group, not after the
groups. When focused tests expose unsupported framework imports or duplicate provider graphs,
reassess the seam before expanding the harness; record what failed and what remains unproved. Scope
substantial harness repair separately; still add no production interfaces solely for testing.

## Review test

Reuse verification for the same tree, command, and environment; rerun when code or dependencies
changed, evidence is missing or suspicious, or a concrete risk needs different proof. Review the
intended red and green observations for new behavior, or the existing named test that already
protects a change.

Before completing a change, ask:

- Is there a smaller design that meets the same acceptance criteria?
- Did we reuse the right existing owner?
- Did every new function, file, abstraction, dependency, comment, and test earn its place?
- Does the diff add a second copy of a function or flow shape another feature already implements?
- Does it add a duplicate owner, pass-through layer, unused public surface, redundant validation,
  compatibility path, or type escape without concrete evidence?
- Did cleanup preserve errors, side effects, ordering, and async behavior as well as return values?
- Can a reviewer understand why the code exists without reconstructing the task history?
