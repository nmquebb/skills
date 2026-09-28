# GitHub Project Roadmap

The roadmap is GitHub Project `roadmap.number` owned by `roadmap.owner` (a user or organization).
Use GitHub CLI project commands; other connectors may not expose Project data.

## Establish access and state

Before any mutation:

1. run `gh auth status` and require the `project` scope; ask the user to run
   `gh auth refresh -s project` rather than expanding access silently;
2. resolve the Project dynamically with
   `gh project view <number> --owner <owner> --format json`;
3. read its README, fields (`gh project field-list <number> --owner <owner> --format json`), every
   active item (`gh project item-list <number> --owner <owner> --format json --limit <n>`, with
   `<n>` above the item count; the default is 30, and a result that reaches the limit means raise
   it and read again), and relevant archived items, which the CLI list omits (query them with
   `gh api graphql`, following every page); and
4. read the applicable lifecycle artifacts.

Never hardcode GraphQL node or option IDs. Stop on duplicate titles, missing fields, unknown
options, or an ambiguous item rather than guessing. When [model](../SKILL.md#preserve-the-model)
fields are missing, offer to create them with `gh project field-create` (single-select `Status` and
`Kind` with the listed options, number `Roadmap order`, text for the rest) and create them only after
approval. Keep the main view grouped by Status and ordered by Roadmap order.

## Operations

- Create draft items for every Kind: `gh project item-create <number> --owner <owner> --title
  "<title>" --body "<body>"`.
- Edit fields with `gh project item-edit --id <item-id> --project-id <project-id> --field-id
  <field-id>` plus `--single-select-option-id`, `--number`, or `--text`, resolving every ID from the
  fresh field list.
- Archive delivered items with `gh project item-archive <number> --owner <owner> --id <item-id>`.
  Use GraphQL only when the CLI does not expose the needed archived state. Never use
  `item-delete` for delivery.

Pin repository references in item bodies to full commit OIDs per the
[GitHub integration](../../q-workflow/references/backends/integration-github.md#durable-links).

## Automation credentials

In automation, repository credentials often lack Projects access. Use a separately provisioned
`project`-scoped credential for these commands only (for example by unsetting `GH_TOKEN` for them
after confirming `gh auth status` for the stored login), and never print or persist either
credential.
