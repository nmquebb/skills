# Code Retrieval

Search to find the existing owner and relevant consumers, then read those implementations. Stop when
the question is answered; do not dump packages or rebuild a graph with serial text searches when a
graph tool or language server can answer. The project's tool routing in its nearest `AGENTS.md`
overrides this reference.

## Start with Quick Scope

When the host exposes Quick Scope's MCP tools (`code_search`, `code_symbols`, `code_deps`; a host
that loads MCP tools on demand finds them by name), use them for the questions they cover;
otherwise, when `qs` is on `PATH`, run its CLI from inside the project. One warm server answers for
the current project, and for its linked projects with `projects: ["*"]` (`--all`) when the question
spans them.

| Question | MCP tool | CLI |
| --- | --- | --- |
| Known text or a pattern | `code_search`, mode `text` or `regex` | `qs search [-m regex]` |
| A file by approximate name, or current Git work (`git:modified`) | `code_search`, mode `files` | `qs search -m files` |
| Behavior or concept; documentation by topic with `paths: ["*.md"]` | `code_search`, mode `semantic` | `qs search -m semantic [-g '*.md']` |
| Where a symbol is defined, a reuse check, or a file's or directory's outline | `code_symbols` with `name` or `path` | `qs symbols <name>`, `qs symbols --path <path>` |
| Callers, references, or impact | `code_symbols` with `references: true`; `code_deps` for a TS/JS file's importers | `qs symbols <name> --refs`, `qs deps <file>` |

Answers show the matching lines; read more of a file with your own tools rather than searching it
again. Narrow with `paths` (`-g`), and put alternatives in one regex (`spawn|exec`). When semantic
search reports `not indexed`, search lexically; run `qs index` only when the user or project
guidance asks, because it writes the index into the project. For what qs does not cover, such as
AST shape, or cannot answer, use the table below and mention the gap in your report.

## Choose the tool by question

| Question | Tool |
| --- | --- |
| Known words, symbols, or paths | Fast lexical search (the project's, the host's, or `rg`); `grep` only without one |
| Current Git work | `git status` and `git diff --name-only`, narrowed by name |
| Behavior or conceptual similarity | The project's semantic code index when one exists; otherwise lexical variants of the concept's likely vocabulary |
| Current convention, decision record, threat, or product decision by topic | Semantic search over documentation when indexed; otherwise lexical search of the documentation tree |
| Reuse check before adding a symbol | The code-graph tool's symbol lookup, or lexical search for the name and its synonyms |
| AST shape | Structural search (such as `ast-grep`) |
| Callers, dependencies, or impact | The project's code-graph tool or language-server references; otherwise lexical search for the symbol, reading each hit |

Use another tool only for a remaining question; the table is not a checklist. Locate a known
identifier lexically, then use the graph or references when its relationships matter. Use semantic
search when the behavior is known but its vocabulary is not. Cite the current guide, decision
record, or threat a search returns instead of a generic concern.

Static results do not prove runtime reachability. Before deleting, check exports, configuration,
generated registries, framework entry points, string-based lookups, and dynamic loading.

An index reflects its last refresh. After substantial additions, removals, renames, or refactors in
a session, or when a result looks stale, refresh it per its tool's instructions or confirm
lexically.

## Escalation and context

After a weak query, try its fuzzy result, a related path, or a precise variant before declaring it
unsupported; if the question is conceptual, structural, or relational, switch to that tool above.
Where the project routes a question to a specialized tool, raw shell search is only for queries that
tool cannot express, debugging it, or required raw pipeline semantics.

Batch independent searches and reads. Filter schemas, tool catalogs, and result sets before
returning them to context. Read only relevant sections and callers; histories and broad maps are
lookup sources, not required context.
