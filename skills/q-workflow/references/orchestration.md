# Q Orchestration

Who runs each role, on which model, and through which launcher. Choose by uncertainty and
consequence, not file count. An explicit user route always wins.

## Roles

Every role below may be set in `agents.routes.<role>`. An unset owner role runs in the invoking
session; an unset supporting role runs as a fresh agent on the launcher's default model, except
where the fallback column says otherwise.

| Role | Runs | Unset fallback |
| --- | --- | --- |
| `specOwner`, `planOwner` | The phase directly | Invoking session |
| `implementationOwner` | Full-lifecycle coordination in the prepared workspace | Invoking session |
| `worker` | Ordinary slice worker or direct implementation | Owner's model |
| `workerNarrow` | Narrow slice with a settled contract and an objective check | `worker` |
| `workerComplex` | High-consequence implementation, hard diagnosis, consequential reconciliation | `worker` at higher effort |
| `workerUi` | UI implementation from a settled design and existing components | `worker` |
| `escalation` | The one bounded repair after an objectively failed attempt | Strongest available model |
| `sliceReviewer` | Fresh read-only review of one slice; findings only | Fresh read-only agent |
| `finalReviewer` | Independent complete-diff verdict | Fresh read-only agent; prefer a different model family |
| `specReviewer`, `planReviewer` | Risk-triggered read-only challenge | Strongest available model, read-only |
| `riskGate` | Manual-risk repair and risk pass | Strongest available model |
| `reviewerA`, `reviewerB`, `adjudicator` | `q-adversarial` panel | Three fresh read-only agents; prefer two model families for the reviewers |
| `evidence` | Sustained device or browser evidence journey | Fresh agent with computer or browser tools |
| `bookkeeping` | Routine Reconcile or Archive run launched by automation | Invoking session |

A route is one string: `<model> [effort] [mode]`, in the launcher's vocabulary. Examples: `opus`
(a Claude Code alias), `<codex-model> high` (Codex), `codex/<model> high full-access` (Paseo).
Efforts are `low`, `medium`, `high`, `xhigh`, or `max`; modes are launcher-specific.

```yaml
agents:
  launcher: paseo
  routes:
    specOwner: claude/<model> medium auto
    worker: codex/<model> medium full-access
    finalReviewer: claude/<model> high plan
```

## Routing rules

- Select the implementation owner separately from its slice workers: coordination does not inherit
  the highest slice risk or the Plan owner's model. Slice workers use `worker` unless a more
  specific worker role applies; preserve an approved Plan's routes.
- Independence means a fresh, read-only context that has not seen the producer's reasoning; on any
  model it satisfies an independent-review gate (final review, Spec or Plan review, risk gate,
  adversarial panel). Prefer a different model family for final and adversarial review whenever a
  configured route offers one; diversity alone does not prove correctness. When provider fallback
  replaces a cross-family reviewer, the fallback must still differ from the model that produced the
  work.
- A review the owner performs in its own context is self-review and never satisfies an
  independent-review gate. When the host cannot start a fresh context, stop at the gate and ask the
  user to choose: run the printed reviewer prompt in a separate session they start and paste back
  its result, configure a launcher that can, or waive the gate explicitly (recorded as a waiver).
- At each phase gate or escalation, launch the exact configured route. When it is unavailable,
  inspect the launcher's provider support, report it, and ask before substituting; never silently
  substitute a configured or user-selected model.
- An owner role with a configured route that the current session does not match: preserve state and
  hand the user a continuation prompt per [Communication](lifecycle.md#communication).
- Changed defaults do not reroute active sessions or override approved in-flight Plans.

## Escalation

Keep the owner across related slices. Consequence selects stronger evidence and independent risk
review, not an automatic frontier owner. Escalate once after an objectively failed implementation
or repair, or an inability to meet acceptance:

- sound approach and ownership but insufficient reasoning: raise effort on the same model;
- ownership, reasoning, or repeated partial-delivery failure: the `workerComplex` route; when that
  route already failed on the boundary, the `escalation` route.

Select one route from the diagnosis; record the failed acceptance claim, current patch, checks, and
route with the session evidence, and carry them into the repair. Do not walk every effort or model
tier, or restart the task. A detected failure must come from acceptance evidence or review, not the
worker's self-assessment alone. If the bounded escalation fails, present resolution options under
[Decision Questions](decision-questions.md); another attempt needs explicit user authorization.
Diagnose command, setup, and provider failures before changing the model. Provider fallback and the
manual-risk gate keep their separate triggers and budgets.

## Provider fallback

When a configured route's provider is exhausted (a session, weekly, model, or spend limit) or fails
three times server-side within thirty minutes (5xx, overloaded, 429), fall back to the configured
equivalent on another provider at the same tier and effort, when routes name one; a single
transient error is a retry. Record the fallback route and trigger in the ledger or issue and return
to the primary at the next phase gate.

## Launchers

`agents.launcher` decides how supporting agents start.

- [`native`](launchers/native.md): the host's own subagent tool (Claude Code, Codex, or a pi
  extension). When the host has none, the owner performs supporting work itself in sequence,
  re-grounding from sources between roles, and records that it was not independent;
  independent-review gates then follow [Routing rules](#routing-rules).
- [`paseo`](launchers/paseo.md): Paseo agents across providers, with worktree registration.

Load only the selected launcher's reference. Every launcher obeys these rules:

- Give each agent a bounded contract as source pointers: outcome, ownership, guidance to read,
  checks, size, and limits. Never pass the full conversation, copied guides, prior transcripts, or
  raw logs.
- Read-only roles never edit, commit, delegate, or mutate the target.
- Use completion notifications, not polling. Record each agent's identity, route, role, and outcome
  in the ledger or issue, then close or archive the agent once its evidence is durable.
- A structured result that fails its schema is returned once to the same agent for re-emission
  before it counts as a workflow failure. Never recover a result from logs or persistence files.
