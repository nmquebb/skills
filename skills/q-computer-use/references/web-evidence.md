# Local Web Evidence

For browser journey proof, run the project's committed browser journey runner named in its testing
guidance (`conventions.testing`) or `AGENTS.md`. The runner owns its isolated application stack,
identities, browser, cleanup, and artifacts. Follow that guidance for prerequisites, required
credentials (such as payment-provider test keys for a hosted checkout journey), and the verdict. A
missing required credential leaves the overall run nonpassing; do not report its named skip as a
pass.

For exploratory inspection of a running local web app, use the host's browser tool (Codex Browser
Use; Claude in Chrome in Claude Code) when it can reach the server, or Playwright with the project's
installed dependencies. pi has no browser tool: use Playwright. A hosted or remote browser (Paseo's
hosted browser, for example) may land on `chrome-error://` for `localhost`. Before Playwright
interaction, run `bash <skill-dir>/scripts/doctor.sh web`, where `<skill-dir>` contains this skill's
SKILL.md, and report a missing prerequisite as a blocker of the Playwright route; a working host
browser tool does not need it. The web checks run on any platform. Do not install software as an
automatic remedy.

Use role and label locators with auto-wait. Scope modal work to
`page.getByRole("dialog", { name })`; the page behind a modal (a Base UI dialog, for example) stays
mounted. Capture the observed transition and identify the app state, route, time, and commit. An
exploratory screenshot or DOM check proves only what it observed; use the committed journey for its
stated acceptance.
