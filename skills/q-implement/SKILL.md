---
name: q-implement
description: "Implement a general software request or a plan supplied as text or a file path. Use when the user explicitly asks for q implementation."
license: MIT
disable-model-invocation: true
---

# Q Implement

Implement the user's requested outcome. Accept a direct instruction, a plan pasted into the
request, or a path to a plan file. A spec, plan, issue contract, approval marker, and managed
workspace are optional. Resolve the actual input and read relevant repository guidance and code
before editing. Use the optional project [config](../q-workflow/references/config.md) when present.

Treat a plan as useful context, not an exhaustive script. Follow its settled requirements while
adjusting details to evidence found in the code. Ask when a missing decision materially changes
behavior, scope, data handling, or a public contract; otherwise make a reasonable choice and keep
moving. Preserve unrelated work and follow the repository's normal branch and delivery practices.

Make coherent changes at the owning code, including needed tests and documentation. Run the
smallest checks that give useful confidence for the changed behavior and report any check that
could not run. Re-run an affected check after a relevant fix; avoid redundant full-suite runs and
review loops. Use [q-tdd](../q-tdd/SKILL.md), [q-code-quality](../q-code-quality/SKILL.md), or a
specialized review when the user asks for it or the change's risk warrants it. Neither creates a
mandatory extra gate for ordinary implementation.

Finish the requested deliverable under the user's existing authorization. A pull request, merge,
release, or archive is part of the task only when requested or established by project guidance.
Report what changed, the checks and their results, and any material limitation. Do not create a
ledger, roadmap item, lifecycle marker, delivery record, or next-step prompt.
