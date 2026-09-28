# Skill History

Append-only provenance for evidence-driven changes to the suite. Search it before changing a
settled choice; read only the last ~40 lines before appending. Format:
`q-improve-skills` → references/evaluation-format.md, "Provenance entry".

### 2026-09-28 — Extraction into a reusable suite

- Source: the author's private project workflow skills at revision `45488947` (14 skills plus
  the workflow, code-style, testing, naming, retrieval, decision-question, projection, metrics, and
  documentation guides they depended on)
- Authority: the author, requesting a reusable suite for their own and others' projects with
  configurable issue, pull-request, and triage workflows
- Problem: skills hardcoded one project's GitHub organization, Project, labels, branches, model
  routes, orchestrator, product risk areas, and repository paths, and linked guides outside the
  skill folders
- Decision: adapted — renamed `q-*`; one configuration contract with tracker, integration, and
  roadmap backends; project addenda for project rules; shared lifecycle references in
  `q-workflow`; code-quality baseline guides moved into `q-code-quality`; roles replace model
  routes; Paseo became an optional launcher; explicit-only skills hidden from the model on all three
  hosts
- Owners: every skill; `q-workflow` references; `scripts/validate.mjs`, `check-compat.mjs`, and
  `check-hosts.mjs`; CI; distribution docs
- Validation: suite validator; 38 script tests; `check-hosts --live` (skills CLI install, installed
  links and scripts, Claude Code plugin install and live Check, Codex model-visible listing and live
  Check, pi's own loader); independent read-only review by a GPT-6 Sol agent at high effort in four
  rounds (28 findings, then 7, then 3, then none blocking or major; one editorial nit kept)
- Next evidence: the first lifecycle delivery and triaged issue in a project on the local backends,
  and the first delivery in the source project after it consumes the suite from `v1`

### 2026-09-28 — First consumer migration

- Source: migrating the source project onto `v1`; four read-only agents compared every retired
  skill with its q version, its automation lanes, and live GitHub state
- Problem: project-wide addendum rules could not reach Triage or Feedback; proposal comments had no
  stated closing marker; a rejected direct Archive push fell back to opening and merging a pull
  request, authority the source never had; provider fallback depended on routes nothing configures
- Decision: adopted — `workflow.md` extends every non-standalone skill (widened before any other
  consumer adopted the suite); the closing marker is explicit; a rejected push stops with the
  commit kept; fallback equivalents come from the project's addendum or guidance, else ask
- Owners: `q-workflow` config, lifecycle, orchestration, artifacts, and GitHub tracker references;
  `q-archive`
- Validation: suite validator, script tests, and compatibility check; the migrated project's
  configuration validated against the schema
- Next evidence: the source project's first Hub-triaged issue and first automated Archive on `v1`
