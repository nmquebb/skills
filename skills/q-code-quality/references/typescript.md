# TypeScript and JavaScript

Baseline rules for TypeScript and JavaScript, extending [code style](code-style.md) with the same
precedence: project guidance overrides any of them, and `conventions.baseline: false` disables them.

## Declarations

- Declare named functions with `function name()`, not `const` arrow assignments. Keep arrows for
  inline callbacks and closures needing lexical `this`.
- Do not initialize a local that every path overwrites before its first read; declare it with its
  type and assign per branch. Before removing an existing assignment, confirm its right-hand side
  has no required side effects.
- Require concrete runtime evidence for CommonJS or dynamic-import workarounds in ESM code.

## Types and failures

- Preserve strict types and let TypeScript prove structural facts at compile time.
- Let concrete implementations infer return types unless an exported contract, interface, or
  callback boundary materially benefits from an annotation.
- Model named object shapes with `interface`; reserve `type` for unions, intersections, and computed
  shapes. Let a service's result values and failure unions infer from their owners; name them only
  at a genuine port or callback boundary.
- Use `as const` only when the narrowed literal type is consumed.
- Model meaningful domain failures explicitly, per
  [code style](code-style.md#suppressions-and-failures); do not widen an error to `unknown` without
  a boundary-driven reason.

## JSX

Use `condition && <Component />` when only the truthy branch renders and a ternary when both
branches render alternatives; make number-valued conditions explicitly boolean so `0` cannot render.

## Class method doc comments

Give every production class method, including static and private ones, a multi-line JSDoc block:
first why it exists or the policy/invariant it preserves, then one `@param` per runtime parameter
and an `@returns` describing the caller-visible outcome. A one-line summary does not replace the
contract. Constructors, test doubles, and fixtures are exempt; keep non-obvious initialization
rationale beside the statement.

```ts
/**
 * Reuses a live invitation so a resend never issues a second valid code for one address.
 *
 * @param email Normalized invitee address.
 * @returns The pending invitation, created when none is live.
 */
async findOrCreatePendingInvitation(email: string) {
  // ...
}
```
