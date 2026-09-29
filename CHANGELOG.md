# Changelog

Consumer-visible changes, newest first. Projects on the `v1` channel receive every entry under
`v1` automatically; see [distribution](docs/distribution.md).

## v1

### 2026-09-28

- Improve Skills can measure a change with an eval: cases drawn from real work, checkable claims
  judged by another model family, a pilot before any baseline, and a fixed train/test split for
  hillclimbing skill text or routes.
- Orchestration gains an Effort section: what effort buys, where to spend it, and that every route
  names one.
- The native launcher explains how Claude Code children get a full model ID or an effort (agent
  definitions), that a Codex agent definition's effort overrides the spawned one, and pi's tools.
- Code retrieval starts with Quick Scope (`qs`) when its MCP tools or CLI are available, and falls
  back to the project's and host's tools for what it does not cover; Threat Model maps entry points
  the same way.
- With `git.remote: none`, skills skip every fetch and push; Archive with `archive.publish: local`
  works on the parent checked out in the control checkout.
- Triage files the issue it triages when the user explicitly asks it to.
- Automated triage uses asynchronous comment approval only with the GitHub tracker; with another
  tracker it reports the proposal and waits for the user's approval in a session.
- Roadmap with `roadmap.backend: none` names `q-workflow` setup only when the user wants a roadmap.
- The Paseo launcher reference notes that every Codex mode Paseo offers can write, so a read-only
  Codex role rests on its instruction.
- Distribution notes how a root `.ignore` hides the installed suite from code search.
- `.agents/q/workflow.md` extends every skill except the standalone ones, including Triage,
  Feedback, Roadmap, and Improve, so project-wide rules reach them.
- GitHub triage proposals close with `<!-- /q-triage-proposal:v1 -->`; readers still accept a
  proposal whose closing marker repeats the opening one.
- A rejected direct Archive push keeps the commit and stops; it no longer falls back to an archive
  pull request.
- Provider fallback uses the equivalents the project names, and asks when it names none.
- Initial release: 15 skills extracted and generalized from a private project's workflow suite.
- Project configuration in `.agents/q/config.yaml` with GitHub, local, and custom tracker
  backends; GitHub pull-request or local-merge integration; GitHub Project, local, or no roadmap.
- Project addenda in `.agents/q/<skill>.md` extend any skill without forking the suite.
- Portable across Claude Code, Codex, and pi; supporting roles run on native subagents or Paseo.
- The `v1` channel only advances past an automated public-API compatibility check.
