---
name: q-feedback
description: "Capture q workflow feedback or resume identified q work (lifecycle delivery or triaged issue) only when q-feedback is explicitly invoked. Ordinary criticism, comments, and continue or resume requests do not trigger it."
license: MIT
disable-model-invocation: true
---

# Q Feedback

Preserve feedback and interrupted work across sessions. Read the project configuration and addenda
per [config](../q-workflow/references/config.md), the relevant
[lifecycle](../q-workflow/references/lifecycle.md) sections, and the applicable active artifacts,
issue, or delivery record before writing.

Run only after explicit invocation; an earlier ordinary comment or continuation request never
authorizes it. Infer the mode from the invocation and ask only when the target cannot be identified
safely:

- **Capture:** the user gives q workflow feedback or asks to preserve an item for an exit interview.
- **Resume:** the user asks to pick up, continue, recover, or re-enter identified q work.
- **Both:** feedback changes how resumed work should proceed.

## Capture

1. Resolve the target from the active branch, `<paths.work>`, a named delivery, a
   `<paths.deliveries>/<slug>.md` record, an approved issue, the project's q configuration, or the q
   suite itself. If several targets remain plausible and the distinction matters, ask which one.
2. The user's words are authority. If the user already chose an outcome, record a decided item with
   that outcome and rationale, not a pending multiple-choice question.
3. For active lifecycle work, append a concise ledger event, plus an exit-interview candidate only
   when a later durable or reusable decision remains. Mark immediate implementation resolution
   separately from broader follow-up. For issue work, add a tracker **note** instead.
4. For archived work, append a stable follow-up entry under `## Follow-up` in its delivery record,
   creating that section at the end when it is missing. Original delivery evidence is immutable;
   this section is the sole append-only exception, holding status, evidence, direction, questions,
   and the owning follow-up.
5. Classify reusable workflow feedback by owner:
   - **project:** only this repository needs it; the owner is a project addendum, the
     configuration, or project guidance;
   - **suite:** every q user would benefit; the owner is `q-improve-skills` working on the suite's
     source.
6. For feedback not applied now, add a stable pending item to `paths.feedback` with the user's
   direction, evidence, scope (`project` or `suite`), and owner.
7. Record feedback with the next normal task or archive commit; create a feedback-only commit only
   when the user explicitly asks to preserve it immediately.

When the feedback should be applied now, load and follow [q-improve-skills](../q-improve-skills/SKILL.md);
otherwise name it as the durable owner without editing skill behavior.

## Resume

1. Inspect the current branch, `git status`, the worktree registry, relevant recent commits, active
   work directories, delivery records, the recorded candidate when present, owned runtime state,
   and applicable `AGENTS.md`.
2. Read the approved Spec and Plan, then the ledger's current state and relevant decisions and
   evidence. After Reconcile Prepare, read the ledger from the implementation branch; the parent's
   copy stays frozen at its pre-Prepare state until merge. For issue work, read the issue and its
   `q-triage:v1` contract. Repository and Git state win over a stale ledger.
3. Build a concise resume brief:
   - objective and approved boundaries;
   - current phase and last durable milestone;
   - task-owned committed and uncommitted changes;
   - validation already completed and still useful;
   - feedback, declined scope, decisions, blockers, and unresolved items;
   - the next safe action and the skill that owns it.
4. Preserve unrelated user changes. A dirty task-owned worktree is resumable; do not require a clean
   restart or recreate artifacts that already have durable successors.
5. Reconcile harmless stale metadata directly. Ask the complete material decision frontier, under
   [Decision Questions](../q-workflow/references/decision-questions.md), only when repository
   evidence cannot settle a real conflict.
6. Load and follow the owning skill in the same invocation; the Resume request is sufficient
   authorization, so require no further q invocation.

Resume points:

- approved Plan without a proved workspace: [q-reconcile](../q-reconcile/SKILL.md) Prepare;
- executable work, or a coherent implementation without its one ready candidate:
  [q-implement](../q-implement/SKILL.md);
- approved issue in progress, or its candidate unmerged: `q-implement` in the issue lane;
- ready, unmerged lifecycle candidate: `q-reconcile` Integrate under its recorded `merge-lean` or
  `manual-risk` policy;
- merged lifecycle candidate with incomplete exact resource cleanup: `q-reconcile` Integrate in the
  control checkout;
- merged lifecycle candidate whose active directory or roadmap projection remains:
  [q-archive](../q-archive/SKILL.md);
- archive commit missing its `q-archive-complete:v1` record: `q-archive` at the external projection
  checkpoint, without recreating the commit;
- discarded delivery: from its ledger `[manual-issue]` note, only when the user explicitly chooses
  new planning or issue work.

## Continue under user authority

Apply newly captured feedback before continuing. Honor explicit instructions to narrow scope,
change an agent or model, waive a check, pause, or stop; record the consequence once. Do not reopen
declined work without materially new evidence of an undeclined critical security or data-loss
boundary.

Report what was captured or reconstructed and continue the owning phase when requested. Stop after
Capture-only work unless the user also asked to resume or apply the feedback.
