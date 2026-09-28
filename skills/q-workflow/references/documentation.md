# Writing Documentation and Records

Write the smallest document that lets its reader make the next correct decision. Remove background,
repetition, and history that do not change that decision; keep the constraints, exceptions, and
evidence that do.

## Give each document one job

| Surface | Keep | Leave out |
| --- | --- | --- |
| `AGENTS.md` | Routing and surprising defaults needed on most tasks in its tree | Tutorials, rationale already owned elsewhere, and delivery history |
| Architecture or convention | Current ownership, boundaries, defaults, and exceptions | Delivery chronology and copied workflow rules |
| Runbook or workflow | Ordered actions, decision points, safety guards, and verification | Narrative postmortems and choices the reader cannot take |
| Delivery record | Stable delivery facts, decisions, meaningful verification, and follow-up, as terse bullets | Narrative, raw transcripts, per-attempt logs, restated ADR content, and current operating guidance |
| Skill or project addendum | Task-specific procedure, domain facts, gotchas, and deterministic resources | Generic advice, human-facing documentation, and copied project rules |
| Ledger, metrics, or provenance | Append-only evidence needed for later comparison or recovery | Explanatory prose that belongs in a current guide |

Update the existing owner and link to it; do not restate a rule across `AGENTS.md`, a skill, and a
technical document. Keep long append-only histories separate from current instructions and route
readers to the relevant entry instead of the whole file.

## Record durable decisions selectively

Archive writes one delivery record under `paths.deliveries` for every merged full-lifecycle
delivery; it never creates ADRs or repairs current guidance.

Write `<paths.decisions>/YYYY-MM-DD-<slug>.md` for an accepted decision that crosses owners,
establishes a lasting constraint, rejects a plausible alternative, or is costly to reverse. Include
context, decision, alternatives, consequences, status, and source links. Create no retroactive ADRs
for historical deliveries.

Plans name the current guides the delivery must update (or `none` with the reason) and whether an
ADR is required (or `none`); Implement completes both before readiness. A delivery record's final
`Current guidance and decisions` section only links to them, or says `None.`.

## Write for retrieval

- Lead with the outcome, current decision, or action.
- One domain term per concept; concrete nouns and active verbs.
- Default first, then only the exceptions a reader could plausibly meet.
- Put branches in a list or table so the reader finds the matching case without reading them all.
- Imperative for procedures, declarative for facts.
- Explain why only when it prevents an unsafe simplification or settles an otherwise reasonable
  choice.
- Keep volatile status in a ledger or archive; keep current guides timeless where possible.
- Point to detailed material only at the decision that needs it.
- Use a short example only when it resolves a likely ambiguity. Keep conclusions and evidence
  links, not retry transcripts.

Calibrate precision to risk: a reversible choice can use a principle and default; a migration,
destructive action, security boundary, or exact output contract needs ordered steps, explicit
guards, and validation.

## Review before finishing

- Would removing this sentence change a correct decision? If not, remove it.
- Is this the canonical owner, or should it link elsewhere?
- Are current truth and historical evidence clearly separated?
- Can the reader find the default, exception, and next action by scanning?
- Does every command name its scope, precondition, and meaningful verification?
- Does each example clarify a likely mistake?
- Do local links resolve, and do implementation claims match current code or an immutable source?
