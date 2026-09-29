# Optional project configuration

The q core skills work without configuration. Read the nearest project guidance first. When a
project uses `.agents/q/config.yaml`, accept only version 2 keys in the adjacent
[JSON schema](config.schema.json). The user can choose artifact locations for individual requests;
configuration does not impose a spec, plan, issue, or delivery directory.

## Precedence

User direction takes priority, then the skill addendum at `.agents/q/<skill>.md`, then configured
conventions, then repository guidance, then the skill defaults. Follow a repository rule when it
sets a real constraint; do not treat a suggested process as authorization for remote writes.

## Settings

All keys beyond `version: 2` are optional. Add only those useful to the project.

| Key | Default | Purpose |
| --- | --- | --- |
| `conventions.codeStyle` | `[]` | Paths to code style guidance |
| `conventions.testing` | `[]` | Paths to testing guidance |
| `conventions.architecture` | `[]` | Paths to architecture guidance |
| `conventions.baseline` | `true` | Whether standalone code quality uses its baseline |
| `commands.format` | unset | Project format command |
| `commands.formatCheck` | unset | Project format check command |
| `commands.lint` | unset | Project lint command |
| `commands.typecheck` | unset | Project typecheck command |
| `commands.test` | unset | Project test command |
| `commands.build` | unset | Project build command |
| `paths.threatModel` | `docs/threat-model.md` | Existing threat model location for standalone skills |
| `agents.launcher` | `native` | Launcher for a requested multi-agent utility |
| `agents.routes.reviewerA` | unset | Adversarial review role |
| `agents.routes.reviewerB` | unset | Adversarial review role |
| `agents.routes.adjudicator` | unset | Adversarial review role |
| `agents.routes.evidence` | unset | Computer-use evidence role |

Existing v1 files and artifacts remain project documents. Migration is deliberate: retain only
settings still used, set `version: 2`, and leave old specs, plans, ledgers, issues, and delivery
records where they are. Do not relocate or delete them as part of configuration setup.
