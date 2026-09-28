# Custom Tracker Adapter

For a tracker the suite does not ship (Linear, Jira, GitLab, and others), set
`tracker.backend: custom` and `tracker.adapter` to a project document. q skills read that document
instead of a shipped backend, so it must be as exact as one.

## Required sections

Write one `##` section per [operation](tracker.md): `resolve`, `read`, `write-contract`,
`set-status`, `note`, `link`, `close`, and `create`. Each gives:

- the exact command, API call, or MCP tool with its arguments;
- how to confirm the write (fetch and compare);
- the retry rule: which step is safe to repeat and how to detect a duplicate.

Also define:

- **Identity:** the issue ID format and how it appears in branch names (`branches.issue` uses
  `{id}`).
- **Statuses:** the backend value for each [tracker status](tracker.md#statuses), and which
  statuses the backend cannot represent.
- **Contract storage:** where the `q-triage:v1` block lives (description, a pinned comment, or a
  document) and how its preservation is verified.

## Example skeleton

```markdown
# Linear tracker adapter

Tools: the Linear MCP server (`get_issue`, `update_issue`, `create_comment`, `list_issue_statuses`).
Identity: `ENG-123`; branches use `{id}` lowercased.

## resolve
Call `get_issue` with the identifier; stop unless exactly one issue returns.

## set-status
Call `list_issue_statuses` for the team first and map ready → "Todo", inProgress → "In Progress",
inReview → "In Review", blocked → "Blocked"; stop when a mapped state does not exist.
...
```

A skill that meets an operation the adapter does not define stops and reports the missing section
rather than improvising.
