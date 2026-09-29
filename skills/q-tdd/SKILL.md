---
name: q-tdd
description: "Use when test-first development is requested or useful for an uncovered behavior change: choose a test, observe the intended failure, and retain red/green evidence."
license: MIT
---

# Q TDD

Use this procedure when test-first development is requested or an uncovered behavior warrants it. It
needs only [q-code-quality](../q-code-quality/SKILL.md) from the q suite: read
`.agents/q/config.yaml` (`conventions.testing`, `commands.test`) and `.agents/q/tdd.md` when
present, with precedence user direction > that addendum > config > project guidance > this skill's
defaults. [Code Style's Tests section](../q-code-quality/references/code-style.md#tests) owns the
test rules. Commands and artifacts come from the project's testing guidance (`conventions.testing`)
or `commands.test`, else the test command the project's `AGENTS.md`, package scripts, or CI define.

1. List the relevant success and failure modes before implementation. Identify an existing test
   that already protects the behavior, or name the uncovered claim.
2. Choose the sanctioned test kind and a fixed, independent expected outcome. For an isolated
   test, make its concrete owned failure modes visible to the reviewer before writing code.
3. Write the smallest test for the uncovered claim and run it before changing production code.
   Record the command, environment, and assertion showing the intended missing behavior failed;
   repair unrelated setup failures before treating the result as red.
4. Implement at the behavior's owner, then run the affected test and record its green result.
5. Report the red and green evidence with the work, using a document only when one already owns it.
   If an existing test already covered the
   change, name that test and its green result instead of adding a duplicate. For a bug fix, add a
   test only when the bug exposes a behavior gap.
