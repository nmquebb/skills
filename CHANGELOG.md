# Changelog

Consumer-visible changes, newest first. Projects on the `v1` channel receive every entry under
`v1` automatically; see [distribution](docs/distribution.md).

## v1

### 2026-09-28

- Initial release: 15 skills extracted and generalized from a private project's workflow suite.
- Project configuration in `.agents/q/config.yaml` with GitHub, local, and custom tracker
  backends; GitHub pull-request or local-merge integration; GitHub Project, local, or no roadmap.
- Project addenda in `.agents/q/<skill>.md` extend any skill without forking the suite.
- Portable across Claude Code, Codex, and pi; supporting roles run on native subagents or Paseo.
- The `v1` channel only advances past an automated public-API compatibility check.
