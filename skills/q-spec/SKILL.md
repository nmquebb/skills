---
name: q-spec
description: "Shape a clear, proportional software specification from a request or existing draft. Use when the user explicitly asks for a q spec. The user chooses where, or whether, to save it."
license: MIT
disable-model-invocation: true
---

# Q Spec

Turn the user's idea into a precise outcome that is useful for planning and implementation. Read
relevant project guidance and inspect existing behavior, constraints, and adjacent work before
asking questions. Treat the user's decisions as settled; distinguish observed facts from assumptions.
Use the optional project context in [config](../q-workflow/references/config.md) when present.

## Decide the destination

Use a path the user supplies. If the user wants a saved spec but gives no path, check project
guidance and nearby documents for an established location. State the proposed path and ask where to
save it before writing. If no convention exists, ask for a path. The user may choose a response in
the conversation instead of a file. Never create a default work directory, ledger, issue, roadmap
item, branch, or commit merely because this skill was invoked. Preserve an existing draft's
location and content when revising it.

## Resolve the outcome

Ask only questions whose answers materially change the intended behavior, boundaries, constraints,
failure handling, compatibility, or acceptance. Group related questions and recommend an option
when evidence supports it. Continue discovery and drafting while a destination answer is pending.
Do not make implementation choices that the outcome does not require.

Write the smallest spec that lets a reader tell what success means. Include the problem, desired
outcome, scope and non-goals, requirements or behavior, meaningful constraints, and observable
acceptance. Explain material tradeoffs and unresolved decisions. Add evidence links where they help
the reader verify a claim. Omit sections that add no information; use
[spec guidance](references/artifact-format.md) as a guide, not a mandatory template.

Review the draft once for contradictions, untestable acceptance, and accidental scope. Save it only
to the chosen location, or present it in the conversation if that was chosen. Report the path or
conversation result and any decision that remains open. Continue into planning or implementation
only when the user requested that work; no separate phase approval or next-step prompt is required.
