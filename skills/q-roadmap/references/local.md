# Local Roadmap

The roadmap is one committed Markdown file, `roadmap.file` (default `docs/roadmap.md`). Git history
is its audit trail.

## Format

```markdown
# Roadmap

<!-- q-roadmap:v1 -->
<Optional operating rules for this roadmap.>

## Active

### 1. Export invoices as CSV

- Status: Ready
- Kind: Feature
- Lifecycle: Plan approved
- Next gate: Reconcile Prepare
- Dependencies or blockers: none
- Priority rationale: Unblocks month-end accounting.
- References: Spec `docs/work-in-progress/export-csv/spec.md @ 1a2b3c4d` · Plan `… @ 5e6f7a8b`

Customers can export invoices as CSV from the billing page.

## Archived

### Export invoices as CSV

- Kind: Feature
- Lifecycle: Archived
- References: Spec … · Plan … · Candidate … · Archive `docs/deliveries/export-csv.md @ 9c0d1e2f`

Customers can export invoices as CSV from the billing page.
```

- The number in each active heading is `Roadmap order`; keep it one-based and contiguous, and keep
  sections in that order.
- Archiving moves the section to the top of `## Archived` without its number and without Status,
  Next gate, and Priority rationale.
- Titles are unique across Active; stop on a duplicate or an unparsable section rather than
  guessing.

## Operations

Edit the file directly, following the [write steps](../SKILL.md#apply-an-operation), and read it
back after every edit. Commit roadmap-only changes as `docs(roadmap): <change>`, or include them in
the phase commit that produced the fact (Spec approval, Plan approval, Archive). Publish them only as
`integration.push` allows.

When the file does not exist, create it with the header, marker, and empty sections on the first
write, after telling the user.
