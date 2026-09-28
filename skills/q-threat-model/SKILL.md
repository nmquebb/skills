---
name: q-threat-model
description: "Create, refresh, or audit the repository threat model. Use only when the user invokes q-threat-model or explicitly asks for work on that document, not for ordinary security-adjacent code review."
license: MIT
disable-model-invocation: true
---

# Q Threat Model

Describe the attacker-facing system in the canonical threat model at `paths.threatModel` (default
`docs/threat-model.md`), not a checklist; reviewers (including cross-host code review) use it. Read
the relevant sections of the project's architecture guidance (the documents
`conventions.architecture` names, else those the nearest `AGENTS.md` or `CLAUDE.md` routes to) and
the [format](references/threat-model-format.md); follow the root `AGENTS.md` or `CLAUDE.md` without
rereading it when loaded.

This skill stands alone. When present, read `.agents/q/config.yaml` for `paths.threatModel`,
`conventions.architecture`, `commands.format`, and `commands.formatCheck`, and the addendum
`.agents/q/threat-model.md`. Precedence: user direction, then the addendum, then the config, then
project guidance, then these defaults. When the q suite is installed,
[config](../q-workflow/references/config.md) holds optional detail.

Run only after explicit invocation. This utility is not a lifecycle phase: it changes no product
executable code, creates no product scope, and never blocks delivery.

## Choose the mode

- **Create** when the threat model is absent: model the whole repository at its current commit.
- **Refresh** when it exists: read it first, then compare its recorded components, boundaries, entry
  points, assets, and controls against the repository before writing.
- **Audit** when the user asks whether the document is still true: report drift and stop; do not
  rewrite without direction.

Record the baseline commit in every mode.

## Ground every claim in evidence

Assert no component, flow, endpoint, or control the repository does not show. Anchor each
architectural claim to a repository path, plus a symbol, route, config key, or short quotation when
that makes it checkable. State an assumption explicitly rather than inventing a fact.

Say which world each finding lives in. Identify each world's paths from the repository (workspace
and package manifests, build and deployment configuration, CI workflows) rather than assuming a
layout, and name them in Scope and assumptions:

- production runtime code;
- CI, build, infrastructure, and developer tooling, including environment configuration;
- tests, fixtures, prototypes, and examples.

Separate attacker-controlled from operator- and developer-controlled input. When a vulnerability
class needs control this system does not grant, say so and lower the severity rather than listing
it anyway.

Never write a secret into the document: record that a credential exists, where it loads from, and
how it is scoped, with its value redacted.

## Map the system

Work outward from the entry points the repository exposes. Check for each of these and record only
those present: HTTP handlers and middleware; authentication; sessions and cookies; SSR and proxy
routes; host or subdomain resolution; uploads and object storage; email and messaging; webhooks;
background, deferred, or post-commit work; database access; and CLI, IPC, desktop, or mobile
surfaces. Follow each into the owning service and its data access, noting where ownership or trust
changes.

For every trust boundary record source and destination, data crossing, channel, guarantees
(authentication, authorization, origin checks, encryption, rate limits), and validation or
normalization. Record tenant isolation wherever a tenant, account, or organization owns the data; a
missing scope check there is a cross-tenant boundary, not an ordinary bug.

## Calibrate assets and the attacker

List only assets whose loss would matter, and why: credentials and session material, user and
tenant records, uploaded objects, codes and links delivered by email or messaging,
integrity-critical state, and availability-critical resources.

Describe a realistic attacker for this deployment and write down the non-capabilities too; an
unbounded attacker inflates every severity and makes the ranking useless.

## Enumerate and prioritize

Prefer a few concrete abuse paths over many generic threats. Each threat names an attacker goal,
prerequisites, the boundary crossed, the assets reached, existing controls with evidence, and the
remaining gap.

Rank qualitative likelihood and impact, each with one or two sentences of justification, then set
priority from both, adjusted for existing controls. Name the assumptions that most influence the
ranking, and calibrate the levels for this repository rather than importing a generic scale.

## Settle context in one frontier

Inspect the repository before asking anything; never ask the user to settle a repository fact. Ask
together only context questions that would materially change scope or ranking: deployment and
exposure, expected scale, data sensitivity, tenancy expectations, and who operates the system.

Ask them as structured multiple-choice questions through the host's question tool, at most four per
call, with each question's evidence and recommendation in the message just before the call and any
recommended option first. Without a question tool, write a numbered list with lettered options plus
"or describe another option", then stop and wait for the answers.

Recommend an answer where the repository implies one. If the user declines or does not know, record
the assumption, mark every dependent conclusion conditional, and continue.

## Write and verify

Write the threat model from the format contract. Before finishing, confirm that every discovered
entry point appears, every boundary appears in at least one threat, runtime is separated from
tooling and tests, every settled or declined context question is reflected, and each evidence anchor
resolves to a real path.

Threat IDs are permanent: never renumber, reuse, or delete one. Mark a threat that stopped applying
mitigated, accepted, or withdrawn with the reason and the change that closed it.

From the repository root, run `node <skill-dir>/scripts/validate-threat-model.mjs <path>`, where
`<skill-dir>` is the directory containing this SKILL.md and `<path>` is `paths.threatModel`, and fix
every failure it prints. It needs Node 20+ and Git; without Node, check the format's validated rules
by hand and report that the validator did not run. When the project's formatter covers Markdown,
format the document with `commands.format` and check that exact path with `commands.formatCheck`.
Run `git diff --check`. Run no typecheck, test, or build; this skill changes no product executable
behavior.

## Report

State the mode, baseline commit, drift found, threats added or changed, unresolved assumptions, and
which conclusions remain conditional. A finding is evidence for a decision, not the decision: never
convert one into product scope, and record a risk the user declines as declined, not pending. State
that the threat model is written (or, after an audit, unchanged) and no next phase follows.
