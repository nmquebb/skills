# q skills

Agent skills for shipping software deliberately: an opt-in spec → plan → implement → archive
lifecycle, a lightweight issue lane, and standalone skills for code quality, test-first
development, adversarial review, threat modeling, and running-app evidence.

The skills work in **Claude Code**, **Codex**, and **pi**, with either a **GitHub** workflow (issues,
pull requests, Projects) or a **local** one (Markdown issues, local merges, a Markdown roadmap).

## Skills

| Skill | Invocation | What it does |
| --- | --- | --- |
| `q-workflow` | explicit or on request | Set up, check, or migrate the project's q configuration; explain the lifecycle |
| `q-spec` | explicit | Define and approve a delivery's outcome, boundaries, and acceptance |
| `q-plan` | explicit | Turn an approved spec into a decision-sufficient plan |
| `q-reconcile` | explicit | Prepare an isolated workspace; integrate, discard, or repair a candidate |
| `q-implement` | explicit | Deliver an approved plan or triaged issue as one ready candidate |
| `q-archive` | explicit or automation | Write the delivery record and clean up after merge |
| `q-triage` | explicit | Turn one issue into an approved, ready implementation contract |
| `q-feedback` | explicit | Capture workflow feedback or resume interrupted work |
| `q-roadmap` | on request | Inspect or update the ordered roadmap |
| `q-improve-skills` | explicit | Evaluate evidence and improve the suite or a project's q setup |
| `q-code-quality` | automatic before completing code | Evidence-based review against the project's conventions and the suite's baseline code style |
| `q-tdd` | automatic for behavior changes | Choose a test, observe the intended failure, keep red and green evidence |
| `q-adversarial` | explicit | Two independent reviewers plus an adjudicator, with debate on disagreements |
| `q-threat-model` | explicit | Create, refresh, or audit an evidence-anchored threat model |
| `q-computer-use` | automatic for device and browser work | Guarded simulator, browser, and macOS interaction with an evidence table |

Explicit skills are invoked as `/q-spec` in Claude Code, `$q-spec` in Codex, and `/skill:q-spec` in
pi. The lifecycle is opt-in: ordinary requests never enter it.

## Install

```sh
# Claude Code, Codex, and pi, via the skills CLI (commit the result)
npx skills add nmquebb/skills#v1 -a claude-code codex pi
```

```text
# Claude Code plugin; then enable auto-update under /plugin → Marketplaces
/plugin marketplace add nmquebb/skills#v1
/plugin install q@q-skills
```

`#v1` is the stable channel: it receives every compatible improvement and never a breaking one.
To update a `skills` CLI install, rerun the same command with `-y` and commit the diff; see
[distribution](docs/distribution.md) for pinning, subsets, and the plugin's auto-update.

## Configure

Run `/q-workflow` (or `$q-workflow`, `/skill:q-workflow`) in your repository. It detects your
setup, asks only what it cannot detect, and writes `.agents/q/config.yaml`:

```yaml
version: 1
tracker:
  backend: local        # github | local | custom (Linear, Jira, … via an adapter document)
integration:
  host: local           # github: one ready pull request | local: merge in your checkout
git:
  parentBranch: main
roadmap:
  backend: local        # none | local | github-project
commands:
  lint: npm run lint
  test: npm test
```

Without a configuration file, skills infer GitHub or local from the remote and `gh` authentication,
and confirm before their first remote write. Project-specific rules go in addenda:
`.agents/q/<skill>.md` (for example `.agents/q/implement.md`) extends that skill for your repository,
and `.agents/q/workflow.md` extends every lifecycle phase. The
[configuration reference](skills/q-workflow/references/config.md) lists every key.

## Multi-agent setups

Supporting roles (slice workers, reviewers, the risk gate, the adversarial panel) use the host's
own subagents by default. Route roles to specific models or providers, or launch them through
Paseo, under `agents` in the configuration; see
[orchestration](skills/q-workflow/references/orchestration.md). Hosts without subagents (pi without
an extension) run worker roles in the owning session and record that. Self-review never satisfies an
independent-review gate: there the skill stops and offers a session you start, another launcher, or
a recorded waiver.

## Contributing

[AGENTS.md](AGENTS.md) holds the authoring rules and the compatibility contract. Validate with:

```sh
node scripts/validate.mjs && node --test "tests/*.test.mjs"
```

MIT licensed.
