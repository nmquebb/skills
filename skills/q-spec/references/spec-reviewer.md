# Specification Reviewer

Use one fresh, read-only, non-delegating context on the `specReviewer` route to challenge a draft
specification, only when material ambiguity, consequential risk, or an explicit user request
triggers review. On a host that cannot launch a fresh agent, tell the user the review cannot be
independent here and let them choose among running the printed reviewer prompt in a session they
start, a self-review recorded as such, or skipping it.

Give it the draft specification, its evidence, applicable repository guidance, and the specific
risk or ambiguity that triggered review, but no intended verdict. Ask it to find contradictions,
hidden assumptions, unnecessary requirements, missed failure boundaries, and acceptance criteria
that do not prove the requested outcome.

Require JSON matching [spec-review-output.schema.json](spec-review-output.schema.json), pasting the
schema's exact contents into the prompt. Every finding cites evidence and says whether the phase
owner can resolve it from repository facts or must ask the user for a genuine preference. Findings
cannot add product requirements, reopen declined scope, or overrule the user.

Record the route, agent ID, trigger, verdict, findings, and disposition in the ledger, counting the
launch under both Planning agent launches and Independent review launches. Resolve or record the
result without a second specification review.
