# Decision Questions

Present every decision the user must settle (a phase frontier, a blocker's resolution options, a
gate outcome, or a phase approval) as structured multiple-choice questions through the host's
question tool when the session exposes one; use the [fallback](#fallback-without-a-question-tool)
only when it does not. Claude Code has `AskUserQuestion`; Codex exposes `request_user_input` in
Plan mode; pi needs a question extension; any other session uses the fallback.

## Ask only what is the user's to settle

Ask only a material decision: one that changes the outcome, scope, ownership, a public contract,
compatibility, failure policy, risk, or verification value. Never ask a repository fact you can
inspect, a decision already settled in the conversation, artifact, or issue, an implementation
detail, or a choice whose options you cannot separate by consequence.

## Carry proof in the message, options in the tool

A question tool typically renders only the question, a short header, and each option's label and
one-line description, with no evidence field. Put the proof in the message text immediately before
the call, one block per question, in header order:

```markdown
**Q<n> · <header>** — <the decision in one sentence>. <Evidence: repository path with line,
commit, or external source and access date; or "user preference, no repository evidence".>
Recommend <option label> because <one reason>.
```

Do not restate option labels or consequences in the block; the tool carries them.

## Question contract

| Field | Rule |
| --- | --- |
| `question` | One decision, answerable without opening the artifact. |
| `header` | At most 12 characters, unique within the batch, and reused verbatim as the decision's ID where the answer is recorded. |
| `options` | Two to four, recommended option first with `(Recommended)` ending its label. Labels are one to five words. |
| `description` | That option's consequence or cost, not a restatement of its label. |
| `multiSelect` | `true` only when the choices genuinely combine. |

Never author an "Other" option when the host supplies a free-text escape; never offer an option you
would refuse to carry out.

## Batch by dependency

Send at most four questions per call, ordered so an earlier answer cannot invalidate a later
question in the same batch. Split a larger frontier into successive calls; never drop, merge, or pad
questions to fit. Ask each batch as soon as it is answerable; do not hold it for a question that
repository work has not yet made answerable.

## Approval is a question

Present a phase approval as the final question of its last batch, naming the artifact path, with
`Approve`, `Approve with noted changes`, and `Revise`. A direct user instruction to continue already
approves; do not re-ask it.

## Record the answers

Record each answer against its header in the owning ledger, artifact, or issue before acting on it,
with free-text answers verbatim. A recorded answer is settled and never asked again.

## Fallback without a question tool

Present the same content as a numbered list: one heading per question with its evidence and
recommendation, then lettered options with consequences, plus "or describe another option"; ask for
one letter per question and stop the turn to wait. The fallback never reduces the number of
decisions asked.
