# Naming

Baseline naming defaults, extending [code style](code-style.md) with the same precedence: the
project's naming guidance and nearest `AGENTS.md` override them. Code style decides whether a new
name should exist at all; the project's architecture guidance owns package ownership.

## Files

Name a file after its primary export, in the project's file-name casing; a mismatch means rename one
of them. Conventional entry points and barrels (such as `main`, `server`, and `index`) keep their
conventional names.

Avoid generic containers such as `data`, `utils`, and `helpers`.

Framework-reserved names win. A suffix a framework reserves is unavailable for a role name: where
`*.client.*` marks browser-only modules, an isomorphic API boundary is `api.adapter`, not
`api.client`. Framework entry points and files that generated code or tooling reference stay where
the framework expects them; do not relocate them.

## Types across layers

One concept can have three shapes, often imported into the same file; keep them distinguishable:

| Layer | Example | Shape |
| --- | --- | --- |
| Wire | `AuthChallengePayload` | `expiresAt: string` |
| Domain | `AuthChallenge` | `expiresAt: Date` |
| Persistence | The persistence library's row type | Database columns |

Wire contracts with a domain twin carry one consistent suffix (`Payload` unless the project names
another); domain types never do. A request or response schema with no domain twin needs no suffix
(`AuthSignupRequest`); add it only to resolve a real collision. Where the persistence library infers
row types, reference them rather than re-declaring them.

## Ports and adapters

Name a port for the role it fills and an adapter for what it is:

```text
AuthCrypto             <- NodeAuthCrypto
EmailSender            <- SmtpEmailSender
AuthRateLimitProvider  <- AuthRateLimiter
AuthAccountsRepository <- AccountsRepository
```

Do not name an adapter after its library or driver (`DrizzleAccountsRepository`). Keep port and
adapter names distinct so consumers need no `import ... as SomethingContract` alias.

## Barrels

A package's barrel (`index` or the language's equivalent) re-exports supported public surface and
defines nothing. Modules import their defining peers directly, never their own package barrel, to
avoid cycles. Keep private repositories, providers, and implementation types out of public barrels.

## Feature layout

A domain occupies a same-named folder in every layer it reaches (service, client, each app). Group
by domain, not technical kind (no `mutations/` or `queries/` directories).

In a frontend feature folder, `components/` holds components only. Non-component modules (state
labels, formatting, guards, drafts, messages) sit at the feature root so other features can import
them without reaching into `components/`.

A shared package holds only what its charter names, such as wire schemas or transport-agnostic
utilities with no domain knowledge. Code that is neither probably belongs to an owning package, not
a shared one.

## Tests

Test layout follows the project's convention, else the language's standard layout. Name a suite for
its source twin; a cross-cutting suite with no single source twin sits at the deepest test directory
covering its whole scope. Do not rename a test solely to satisfy a preferred subject shape.
Test-only fixtures and harness modules live in test support; a test-support module other packages
import is public surface and lives with production source.

The runner's selection is authoritative: a file it does not select never runs, whatever its name. A
new test location, suffix, or package needs a matching runner selection or script in the same
change.
