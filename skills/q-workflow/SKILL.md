---
name: q-workflow
description: "Explain or configure the lightweight q spec, plan, and implementation skills for a project. Use when the user asks about q workflow setup or conventions."
license: MIT
disable-model-invocation: true
---

# Q Workflow

The core skills are independent entry points: [Spec](../q-spec/SKILL.md) clarifies an outcome,
[Plan](../q-plan/SKILL.md) accepts freeform text or a file, and
[Implement](../q-implement/SKILL.md) accepts a direct request or a plan. The user may start at any
point, combine them in one request, or use none. Do not route an ordinary request through a phase
sequence or require an approval for each handoff.

For setup, inspect existing project guidance before proposing `.agents/q/config.yaml`. Add only
settings the project actually needs, using [config](references/config.md) and its schema. Project
addenda in `.agents/q/<skill>.md` may extend individual skills. Do not create a work directory,
issue tracker, roadmap, archive process, agent route, or default spec path as part of setup.

When asked to check configuration, report conflicts or stale keys with a concrete suggested edit.
When asked to migrate a v1 project, explain that v1 artifact locations and records remain project
documents, while v2 skills no longer manage them. Preserve existing artifacts and project files;
change or remove configuration only as the user requests. Specialized standalone skills remain
available independently.
