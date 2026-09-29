---
name: q-plan
description: "Turn a freeform specification, a spec file, or a stated outcome into a practical implementation plan. Use when the user explicitly asks for a q plan."
license: MIT
disable-model-invocation: true
---

# Q Plan

Accept the specification as text in the request, a path to a file, or an existing document the user
identifies. A formal q spec and approval state are not prerequisites. If the input is incomplete,
inspect relevant code and guidance, state reasonable assumptions, and ask only questions that would
materially change the plan. Do not invent requirements to fill a template.

Use project guidance and the optional [config](../q-workflow/references/config.md). Find the
affected owners, reusable code, contracts, dependencies, and meaningful test seams. Keep the plan
proportional to the work. For each useful unit of work, say what changes, which behavior or contract
it serves, and how to tell it works. Call out ordering only where one change depends on another.
Include migration, failure behavior, or compatibility detail when material. Prefer a short sequence
of concrete actions over file-by-file instructions or a prescribed agent structure. See
[plan guidance](references/plan-format.md) for an optional outline.

Use a destination the user supplies. If a plan file is wanted but no path is given, use an
established project location or ask where to save it; otherwise present the plan in the response.
Do not require a ledger, roadmap update, branch, commit, independent reviewer, or approval ceremony.
Do not change the source spec unless the user requested that edit. Report assumptions that
implementation must resolve, and continue into implementation only when the user requested it.
