# Paseo Launcher

Use Paseo agents for supporting roles across providers. Load the installed `paseo` skill for tool
and CLI syntax; this reference owns only the q rules on top of it.

## Launch roles

- Launch each role with the exact provider, model, mode, and effort from its route:
  `create_agent` with `provider: "<provider>/<model>"`, `settings.modeId`, and
  `settings.thinkingOptionId`. Do not substitute agent profiles for configured routes.
- When a route is unavailable, run `paseo provider diagnostic <provider> --json` or
  `inspect_provider` before offering alternatives; report any fallback.
- Mode equivalents across providers: Codex `full-access` is Claude `bypassPermissions` unattended
  and `auto` interactive; Codex `auto-review` is Claude `plan` (read-only).
- Tell Claude plan-mode roles to inspect immediately without `ExitPlanMode` or write-access
  requests.
- Rely on `notifyOnFinish`, not polling. Archive a disposable child with `archive_agent` once its
  identity and evidence are recorded; never archive the user-facing owner.

## Synchronous structured results

Roles whose JSON result the caller consumes directly (for example the `q-adversarial` panel) use
Paseo's agent API, not nested `paseo run`: create the agent with a minimal bootstrap prompt that
establishes its read-only role and tells it to wait for the evidence packet, then send the complete
task with `send_agent_prompt` and `background: false`, and use the returned content directly.

- Keep each result within the synchronous window: minified JSON, concise strings, only material
  content.
- If a synchronous call times out while the agent continues, wait until it is idle and retry once
  with a no-more-inspection prompt to re-emit its completed result, accepting only that retry's
  direct content. If that also fails, stop the role.
- Never recover a result from `paseo logs` or agent persistence files; logs are timeline evidence
  only.

For `paseo run --output-schema <schema> --json`, capture stdout and stderr to separate files in a
temporary directory outside the repository. A successful run's stdout is exactly one JSON object
that satisfies the schema, and its stderr names the exact expected workspace in its
`Using workspace <workspace-id>` notice; a missing or mismatched workspace fails the role.

## Projects and workspaces

- Keep each repository under one Paseo project. Before registering a workspace, resolve the existing
  project for the canonical source checkout and pass its exact project ID; stop on zero or several
  plausible projects rather than selecting by display name.
- For a lifecycle delivery, Reconcile Prepare creates the plain-Git worktree itself, then registers
  that path as a Paseo `local` workspace under the project ID. Never use a Paseo-managed worktree for
  a delivery: archiving its last workspace deletes the checkout, while a registered plain worktree
  survives. Run `commands.install` there explicitly, because Paseo's worktree setup runs only in
  Paseo-owned worktrees.
- When Spec creates a new delivery, rename the current workspace to the delivery title with
  `rename_workspace`. If that fails and the exact workspace ID is independently known,
  `paseo workspace rename <workspace-id> <title>` is the only fallback. Never select a workspace
  heuristically from the current directory or among several same-directory workspaces. This is UI
  metadata, not lifecycle evidence: report a failure briefly and continue.
- Paseo's archived or finished state is UI state only; it never replaces workspace teardown, branch
  cleanup, or recorded cleanup evidence.

Record in the ledger: the Paseo project ID, the workspace ID and path, and each agent's ID, route,
role, and outcome.
