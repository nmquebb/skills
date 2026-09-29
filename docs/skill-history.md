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
  configuration validated against the schema; live Check in Claude Code, Codex's model-visible
  listing, and pi's loader in the migrated project; independent GPT-6 Sol review at high effort (3
  major and 1 minor finding, all fixed and verified, one adding the read rule for proposals closed
  by a repeated opening marker)
- Next evidence: the source project's first Hub-triaged issue and first automated Archive on `v1`

### 2026-09-28 — Second consumer: local backends

- Source: configuring a local-only Rust project (no remote) on `v1`: local tracker, local
  integration, no roadmap, Paseo routes
- Problem: fetch steps assumed a remote; Archive's local publication had no defined working branch;
  Triage could not file the issue it was asked to triage; automated approval named only GitHub's
  comment protocol; Roadmap with `none` pushed setup; the Paseo reference implied a read-only Codex
  mode; the installed suite crowded hidden-directory code search
- Decision: adopted — every fetch is conditional on a remote; Archive with local publication works
  on the checked-out parent; Triage creates the issue on explicit request; other trackers' automated
  approval waits for the user; a root `.ignore` hides the suite from search tools
- Owners: `q-workflow` config, lifecycle, and Paseo launcher references; `q-reconcile`,
  `q-archive`, `q-triage`, `q-roadmap`, `q-implement` issue protocol; distribution docs
- Validation: the consumer's configuration validated against the schema; live Check in Claude Code,
  Codex's model-visible listing, and pi's loader in the consumer; independent GPT-6 Sol review (1
  blocker, 2 major, 3 minor, 1 nit, all addressed)
- Next evidence: the first local lifecycle delivery and local triaged issue

### 2026-09-28 — Quick Scope for code retrieval

- Source: the author, adopting Quick Scope (`qs`, their code-intelligence CLI and MCP server
  wrapping fff, CocoIndex Code, Serena, and AgentMap) across the suite and its consumers
- Problem: code retrieval named tool kinds only, so each project routed its own fff, semantic-index,
  and graph tools, and agents started three servers for one question type each
- Decision: adopted — code retrieval starts with qs's MCP tools, else its CLI, and keeps the
  tool-kind table as the fallback for what qs does not cover; building an index stays with the user
  or project guidance because it writes into the project; standalone Threat Model names qs
  inline for mapping entry points, since it cannot depend on `q-code-quality`
- Owners: `q-code-quality` code retrieval; `q-threat-model`
- Validation: qs's agent benchmark (28 tasks x 3 repeats): with qs, Luna went from 96% to 100%
  correct and read half the tool output, at more time and input tokens
  (`20260928-124816-baseline`); after tuning, Luna and Sol answered every task
  (`20260928-152355-tuned2`)
- Next evidence: lifecycle deliveries in both consumers using qs, and gaps agents report

### 2026-09-28 — Evals and effort

- Source: Anthropic, "Automating eval design and hillclimbing" and "Spending your effort"
  (claude.dev blog, accessed 2026-09-28, read through a summarizer); Claude Code 2.1.282's bundled
  `claude-api` eval workflows and `claude plugin eval` (proprietary; method only); anthropics/skills
  `skill-creator` at `b9e19e6f` (Apache-2.0); `--help` and docs of Claude Code 2.1.282 and Codex
  0.157.0; the author's qs agent benchmark
- Authority: the author, asking to integrate both posts across Claude, Codex, and future hosts
- Problem: improvements were validated structurally plus at most two scenario runs; prospective
  model and effort trials fill slowly (none of eighteen slots used after six days in the source
  project); nothing measured skill behavior repeatably across hosts; the native launcher called
  Claude Code effort unselectable per child
- Decision: adopted — an eval method in `q-improve-skills` (real-work cases, cross-family judges,
  pilot before baseline, fixed train/test split, one root-cause change per round, kept only when
  test improves too) and an Effort section in orchestration; adapted — a host-neutral harness
  (`scripts/eval.mjs`) over the Claude-only tools, whose scaffolds are proprietary here and
  unmerged upstream; corrected — Claude Code child model and effort, Codex agent-file effort, pi's
  tools; deferred — a consumer-facing eval skill, per-skill effort frontmatter (Claude Code only),
  multi-turn cases, and a pi adapter (pi not installed)
- Owners: `q-improve-skills` SKILL.md and references/evals.md; `q-workflow` orchestration and native
  launcher; `evals/`, `scripts/eval.mjs`, `scripts/eval/`, `tests/eval.test.mjs`; AGENTS.md
- Validation: suite validator, 56 script tests, compatibility check; pilots at one repeat:
  `skill-triggers` 36 of 36 (Opus 5.5 and GPT-6 Sol, medium); `review-effort` 10 of 10 for Opus 5.5
  at low and at high (high at 1.6 times the list cost and 1.9 times the time), 10 of 10 for GPT-6
  Astra low, 9 of 10 for GPT-6 Luna high (missed uneven shares in the bill split); both suites
  have no headroom, so they guard regressions and cost, not quality gains
- Next evidence: a private review suite from the source project's confirmed review findings and
  escaped defects, with headroom below 95%, at three repeats across its configured reviewer routes
