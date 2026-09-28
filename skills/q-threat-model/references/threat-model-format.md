# Threat Model Format

The threat model (`paths.threatModel`, default `docs/threat-model.md`) uses these headings in this
order and no other level-two headings. Never drop a section; explain an empty one in one line.
`<skill-dir>/scripts/validate-threat-model.mjs` checks the headings, the Status block, the threat
index and subsections, and evidence paths.

```markdown
# <Project> Threat Model

## Status

- Baseline commit: `<short SHA>`
- Reviewed at: <UTC timestamp>
- Scope: <what this models>
- Out of scope: <what it deliberately excludes>
- Open assumptions: <count>

## Executive summary

## Scope and assumptions

## System model

### Components

### Trust boundaries

| Boundary | Data crossing | Channel | Guarantees | Validation | Evidence |
| -------- | ------------- | ------- | ---------- | ---------- | -------- |

### Diagram

## Assets

| Asset | Why it matters | Objective | Evidence |
| ----- | -------------- | --------- | -------- |

## Attacker model

### Capabilities

### Non-capabilities

## Entry points

| Surface | How reached | Boundary | Notes | Evidence |
| ------- | ----------- | -------- | ----- | -------- |

## Abuse paths

## Threats

| ID | Title | Boundary | Priority | Status |
| -- | ----- | -------- | -------- | ------ |

### TM-001 — <short title>

- Status: active | mitigated | accepted | withdrawn
- Goal:
- Prerequisites:
- Action:
- Impacted assets:
- Existing controls:
- Gap:
- Recommended mitigation:
- Detection:
- Likelihood: low | medium | high — <justification>
- Impact: low | medium | high — <justification>
- Priority: critical | high | medium | low

## Priority calibration

## Focus paths for review

| Path | Why it matters | Threats |
| ---- | -------------- | ------- |

## Open questions
```

## Status block

The baseline commit is a backticked SHA that resolves to a commit in the repository. Reviewed at is
a UTC timestamp written `YYYY-MM-DDTHH:MM:SSZ`, not earlier than the baseline commit and not in the
future. Open assumptions equals the number of numbered items (`1.`, `2.`, and so on) under Open
questions.

## Field rules

Objective is C, I, A, or a combination. Evidence is one or two repository-path anchors per claim,
narrowed by a symbol, route, config key, or short quotation when that makes it checkable. Write a
path anchor as a backticked repository-relative path, optionally ending in `:<line>`. The validator
treats a backticked token without spaces as a path anchor when its first path segment exists at the
repository root or it looks like a file or directory path (a slash and a final extension such as
`.js`, or a trailing slash): the path must exist and the line must fall inside the file. It skips
URLs, absolute paths, globs, and prose such as `HTTP/1.1`.

Write threats as short subsections, not one wide table, so a refresh diffs readably and a reviewer
can cite a single threat.

Give each abuse path a numbered sequence from attacker goal through steps to impact, naming the
threat IDs it realizes; prefer multi-step paths over single-line generic threats.

Focus paths are the point of contact with code review: two to thirty repository-relative paths,
each with one sentence tying it to a threat ID.

## Identity and status

IDs are `TM-001`, `TM-002`, and so on, in creation order.

- `active`: the gap still exists.
- `mitigated`: a control now closes it; name the control and its evidence.
- `accepted`: the user decided to carry the risk; name the decision.
- `withdrawn`: the threat was wrong or its precondition disappeared; say what changed.

Keep the index table ordered by priority, then by ID, and the subsections ordered by ID. Each index
row and its subsection carry the same ID, title, status, and priority, and the subsection's Status
and Priority lines hold only the value. Keep non-active threats in the document; they record why
the system looks the way it does.

## Priority calibration

Define each level for this repository with two or three examples drawn from its real assets and
exposure. Anchor the definitions to what an attacker reaches: authentication bypass, cross-tenant
access, and credential or session theft rank above information leaks that need improbable
preconditions.

## Diagram

Include one compact Mermaid `flowchart` showing primary components and trust zones. Keep it
renderable: simple node identifiers with quoted labels, `-->` edges only, subgraphs for trust
zones, no `title` or `style` directives, plain-word edge labels, and short node labels. Put paths,
URLs, and protocol detail in the prose, not in the diagram.

## Refresh

A refresh rewrites the Status block, adds new findings, and updates the status of existing ones. It
preserves prior IDs, prior accepted-risk decisions, and the wording of anything that did not change.
Record drift as a change to the affected rows and threats, not as a new document.
