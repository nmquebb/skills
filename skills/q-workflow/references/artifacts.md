# Lifecycle Artifacts

Repository Markdown is authoritative for full-lifecycle scope, planning, execution history, and
completed knowledge. The tracker, roadmap, and integration host are projections for portfolio,
conversation, review, and delivery. Commit an artifact before projecting a bounded summary and
durable reference; never keep a second editable Spec or Plan in an issue, roadmap item, or pull
request.

## Surface ownership

| Surface | Owns |
| --- | --- |
| Roadmap, when configured | Delivery order, status, lifecycle, next gate, dependencies, blockers, and compact evidence references |
| `spec.md` | Outcome, boundaries, evidence, decisions, risks, non-goals, and acceptance |
| `plan.md` | Owners, contracts, meaningful milestones, delivery policy, and verification strategy |
| `ledger.md` | Execution, decisions, deviations, evidence, lineage, unresolved state, and discarded-attempt notes |
| Ready candidate | Delivered outcome, current evidence and gaps, risk policy, exact head, merge, and artifact references |
| Delivery record | Completed delivery evidence, decisions, deviations, actual verification, merge identity, and links to current guidance |

The formats live with their owning skills: [spec and ledger](../../q-spec/references/artifact-format.md),
[plan](../../q-plan/references/plan-format.md),
[reconciliation block](../../q-reconcile/references/reconciliation-record.md), and
[delivery record](../../q-archive/references/archive-format.md).

A full-lifecycle delivery has no tracker issue; its roadmap item, when configured, is its portfolio
identity until the candidate exists. The lightweight issue lane is the exception: its approved
`q-triage:v1` block is the sole planning artifact, with no lifecycle archive or roadmap item.

## Durable references

Reference committed artifacts in the integration backend's durable form: a
[GitHub link](backends/integration-github.md#durable-links) pinned to a full commit OID once that
commit is published, or a [local reference](backends/integration-local.md#durable-references) of
path plus commit OID. An approved amendment projects its new OID without rewriting the old approval
history.

## Projection sequence

1. **Spec:** create or reuse the roadmap item. After approval, commit the Spec and record its OID;
   on GitHub, do not link it until it is published.
2. **Plan:** commit the approved Plan and delivery policy. Create no delivery issue.
3. **Reconcile Prepare:** publish the approved artifact commits when the host needs it, verify their
   OIDs, add durable Spec and Plan references to the roadmap, and create the implementation
   workspace.
4. **Implement:** after coherent implementation and proportional verification, publish one ready
   candidate with durable Spec and Plan references and add its reference to the roadmap. Publish no
   milestone drafts.
5. **Reconcile Integrate:** merge the exact candidate head under its recorded policy. Mark the roadmap
   item Done with Archive as the next gate; leave the active artifacts on the parent.
6. **Archive:** commit the delivery record with inline metrics and the active-directory deletion on
   the parent, publish it per `archive.publish`, then add the durable Archive reference and archive
   the roadmap item.

Every reference write follows the commit it describes. A failed projection resumes at that external
checkpoint without recommitting correct repository state; a roadmap failure never rolls back an
authorized merge.

After Prepare, an approved Spec or Plan amendment is published by the phase already authorized to
push the implementation branch; then its candidate and roadmap references are refreshed. The
amendment grants no authority for unrelated publication.

## Markers

| Marker | Lives in | Written by | Read by |
| --- | --- | --- | --- |
| `q-lifecycle:v1 slug=<slug> policy=<policy>` | Pull request body (github) or landing commit message (local) | `q-implement`, `q-reconcile` | `q-reconcile`, `q-archive` |
| `q-triage:v1:start` … `q-triage:v1:end` | Issue description or local issue file | `q-triage` | `q-implement`, `q-reconcile`, `q-feedback` |
| `q-triage-proposal:v1` … `/q-triage-proposal:v1` | GitHub issue comment | `q-triage` | `q-triage` |
| `q-reconcile-complete:v1` | Pull request comment (github), ledger or delivery record (local) | `q-reconcile` | `q-archive`, `q-feedback` |
| `q-archive-complete:v1` | Pull request comment (github) or the delivery record's `## Archive completion` section (local) | `q-archive` | `q-archive`, `q-feedback` |
| `q-roadmap:v1` | Local roadmap file | `q-roadmap` | `q-roadmap`, lifecycle phases |

Markers are part of the compatibility contract: readers accept every version the suite has written,
and writers write the newest.
