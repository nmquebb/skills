---
name: q-adversarial
description: "Read-only multi-agent adversarial review of a concrete diff, PR, plan, document, or design: two independent reviewers and an adjudicator report every adjudicated finding and implement none. Use only when the user invokes q-adversarial."
license: MIT
disable-model-invocation: true
---

# Q Adversarial Review

Run a read-only adversarial review of the invocation's request. This is an explicit utility, not a
lifecycle phase: never edit the reviewed work, open a lifecycle artifact, or silently turn findings
into implementation scope.

This skill stands alone. When present, read `.agents/q/config.yaml` for `agents.launcher`,
`agents.routes.reviewerA`, `agents.routes.reviewerB`, `agents.routes.adjudicator`, `conventions.*`,
and `paths.threatModel`, and the addendum `.agents/q/adversarial.md`. Precedence: user direction,
then the addendum, then the config, then project guidance (the nearest `AGENTS.md` or `CLAUDE.md`),
then these defaults. When the q suite is installed,
[orchestration](../q-workflow/references/orchestration.md) and its launcher references hold optional
detail.

Before launching agents, read [references/review-protocol.md](references/review-protocol.md) and its
three output schemas; with the Paseo launcher, also load the installed `paseo` skill.

Ask each decision as a structured multiple-choice question through the host's question tool, with
its evidence and recommendation in the message just before the call and the recommended option
first. Without a question tool, write a numbered list with lettered options, recommended first, plus
"or describe another option", then stop and wait for the answer.

## Resolve the target

Treat the text accompanying the invocation as the review request. Resolve references (a pull
request, the current diff, recent work, a plan, a document) from conversation and repository
evidence before asking. Establish the exact target and baseline:

- pull request: its base and head;
- working-tree or recent work: the relevant diff and commits;
- plan, specification, design, or document: its owning requirements and revision;
- anything else: the artifact and the claims the review should test.

Read the applicable project guidance and owning requirements. Preserve user constraints, accepted
risks, and declined scope. Ask one concise question only when the target or baseline cannot be
discovered safely.

## Launch the panel

Launch three fresh, independent, read-only contexts through the configured launcher
(`agents.launcher`; default `native`, the host's own subagent tool), never another launcher as a
silent fallback:

1. reviewer A on `agents.routes.reviewerA`;
2. reviewer B on `agents.routes.reviewerB`;
3. a separate adjudicator on `agents.routes.adjudicator`.

Launch each configured route exactly; an unset route uses the launcher's default model. The two
reviewers use two different model families whenever the launcher offers them (for example the
Paseo launcher with a Claude route and a Codex route). When it cannot, say so before reviewing and
ask the user to choose: accept a single-family panel, recorded as a limitation; configure reviewer
routes on two families; or run the user-run panel below with a second family. Other routing
defaults do not change this panel. Record each role's launcher, provider, model,
effort, mode, and agent identity. Use the current workspace so reviewers see working-tree state;
create no isolated worktree.

Before reviewing, confirm the launcher can start all three contexts on their exact routes, return
each role's content directly to this session, and send follow-up prompts to the same contexts. When
it cannot (for example pi without a subagent extension), or an exact configured route is unavailable
after inspecting the launcher's provider support, stop before reviewing and offer concrete
alternatives as a decision: configure the Paseo launcher with reviewer routes on two model families;
enable a subagent tool on this host; or run a user-run panel, where you print each role's complete
prompt, the user runs each in its own fresh session (keeping reviewer sessions open for debate) and
pastes back its result, and you validate it like a launched one. Never simulate the panel in one
context (a launcher's sequential self-review fallback does not apply here), recover a result from
logs or agent persistence files, or silently change routes; report any fallback the user chooses.

Start both reviewers concurrently; start the adjudicator only after both review results are
accepted. Keep all three contexts until the final adjudication is accepted, then close or archive
them. Keep each JSON result minified, with concise strings and only material findings.

No role may delegate, mutate the target, or substitute for a missing role; tell each to inspect
immediately, without requesting write access. Command, permission, provider, or malformed-output
failures are workflow failures: return an invalid result once to the same agent for re-emission,
then correct the packet or invocation and retry the same route; never escalate the model.

With the Paseo launcher ([detail](../q-workflow/references/launchers/paseo.md) when installed):

- Use the agent API, not nested `paseo run`. Create each role in the current workspace with a
  minimal bootstrap prompt establishing its read-only role and telling it to wait for the evidence
  packet, then send the complete task through the synchronous prompt surface and use the returned
  content directly.
- Keep each result within the synchronous client window, at most 350 words. If a synchronous call
  times out while its agent continues, wait for the agent to go idle and retry once with a
  no-more-inspection prompt to re-emit its completed result under the same limit, accepting only
  that retry's direct content. If it also times out or returns status without content, stop the
  panel.
- Tell Claude plan-mode roles to inspect immediately without `ExitPlanMode` or write-access
  requests.
- When a route is unavailable, run `paseo provider diagnostic <provider> --json` before offering
  alternatives.

## Run independent reviews

Give both reviewers the same packet per the protocol, with no diagnosis, expected answer, or the
other reviewer's work. Each challenges correctness, acceptance fidelity, security and data
boundaries, failure behavior, compatibility, verification claims, scope discipline, and
maintainability where they apply. A finding needs a concrete impact and checkable evidence; generic
advice, formatting preferences, and requirements outside the approved outcome are not findings.

Require JSON matching
[references/reviewer-output.schema.json](references/reviewer-output.schema.json), with the schema's
exact contents in the prompt. The direct response must be exactly one JSON object with no prose,
fence, preamble, or trailing value; validate every schema constraint, the role-specific IDs, and
semantic invariants before continuing.

## Adjudicate every finding

Give the fresh adjudicator the complete evidence packet and both raw reviewer results. It inspects
the cited evidence, maps every reviewer finding to exactly one decision, merges true duplicates,
preserves complementary findings, and distinguishes a factual conflict from the other reviewer's
silence. It must not settle a product preference because one reviewer sounds more confident.

Require JSON matching
[references/adjudication-output.schema.json](references/adjudication-output.schema.json) with the
same single-object and schema validation. Reject an adjudication that drops a source finding,
invents an unreviewed decision, or marks a material discrepancy resolved without evidence.

## Debate discrepancies

For every `debate-required` decision, use the launcher's follow-up surface to send the adjudicator's
exact question and both original positions to both original reviewers, in their own contexts. Each
maintains, revises, or withdraws its position with checkable evidence per
[references/debate-output.schema.json](references/debate-output.schema.json), answering
independently before seeing the other's new response.

Validate each direct response the same way; if the launcher cannot return follow-up content
directly, stop rather than reading logs or persistence files. Give both accepted responses to the
same adjudicator through the same surface for a new complete adjudication. Run one final round only
when newly cited evidence could resolve a remaining factual conflict. After at most two rounds, the
adjudicator marks any unresolved evidence conflict or genuine preference `user-feedback-required`.
The final adjudication contains only `confirmed`, `dismissed`, or `user-feedback-required`
decisions.

## Report every decision

Present a self-contained review: target and baseline, the panel (each role's launcher, route, model,
and mode), coverage and limitations (including reviewers that shared a model family), and one
decision ledger with every adjudicated candidate's outcome, severity, source finding IDs, concise
rationale, and required action when confirmed.

List `user-feedback-required` decisions separately with the exact unresolved question, both viable
positions, their tradeoffs, and a recommendation only when evidence supports one. Include dismissed
findings with why they were rejected so the user can audit the panel. If nothing is confirmed, say
so directly without manufacturing work.
