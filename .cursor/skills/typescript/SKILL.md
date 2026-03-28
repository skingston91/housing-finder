---
name: typescript
description: Applies project TypeScript rules from .agentrules/typescript. Use when implementing or reviewing TypeScript code, when enforcing type safety, or when the user asks for TypeScript compliance or strict typing.
---

# TypeScript

Apply this skill when implementing or reviewing **TypeScript** so code follows the project’s TypeScript agent rules in `.agentrules/typescript/` and `tsconfig.json` (strict, noUncheckedIndexedAccess). Ensures strict typing, consistent style, and type-safe patterns.

## When to Apply

- **Implementing features** — All new or modified `.ts` / `.tsx` code.
- **Code review or compliance** — When checking that TypeScript rules are followed.
- **User asks** — e.g. “follow TypeScript rules”, “ensure type safety”, “fix types”.
- **Before marking work complete** — With follow-agent-rules; run `tsc -b` or `npm run build`.

## Rule Sources

| Source | Purpose |
|--------|--------|
| `tsconfig.app.json` | `strict: true`, `noUncheckedIndexedAccess: true` — app and `shared/` code must satisfy the compiler. |
| `.agentrules/index.md` | TypeScript: no `any`; run tsc before finishing. |
| `.agentrules/typescript/` | Naming, return types, import type, arrow functions, type-safe patterns, etc. |

For the full list of rule files, see [reference.md](reference.md).

## Quick Rules

### Strict typing

- **No `any`** — Use proper interfaces, generics, or `unknown` with type guards.
- **Explicit return types** — Declare return types on top-level functions (exception: components that return JSX). See `.agentrules/typescript/return-types.md`.
- **Type-only imports** — Use `import type { T } from '...'` for types (top-level preferred). See `.agentrules/typescript/import-type.md`.

### Style and structure

- **Arrow functions** — Prefer `const fn = (): ReturnType => { ... }` and `export const fn = ...`. Use `function` only when you need hoisting (e.g. recursion). See `.agentrules/typescript/arrow-functions.md`.
- **Naming** — kebab-case files; camelCase variables/functions; PascalCase types/interfaces/classes; ALL_CAPS constants; prefix type params with `T`. See `.agentrules/typescript/naming-conventions.md`.
- **File extensions** — `.ts` for no-JSX (utils, types, index re-exports); `.tsx` for JSX. Index files re-export only, no implementation.

### Index and object access

- **noUncheckedIndexedAccess** — `arr[i]` and `obj[key]` are `T | undefined`. Narrow or check before use; avoid unsafe indexed access.
- **Type-safe access** — If the project defines helpers (e.g. `getArrayElement`, `assertDefined`), use them for array/object access; otherwise guard indexed access explicitly.

### Interfaces and types

- **Interfaces for props** — Define interfaces for component props; use union types for variants.
- **Avoid type assertions** — Use only when necessary; prefer type guards or better types.
- **Generics** — Use when needed (e.g. `FormField<T>`); prefix type parameters with `T`.

## TypeScript Checklist

Before considering TypeScript work complete:

- [ ] No `any`; use interfaces, generics, or `unknown` + type guards.
- [ ] Top-level functions have explicit return types (except components returning JSX).
- [ ] Type-only imports use `import type` (top-level preferred).
- [ ] Arrow functions used for helpers and callbacks; `function` only when hoisting is required.
- [ ] Naming follows project conventions (kebab-case files, camelCase, PascalCase, etc.).
- [ ] Indexed access respects `noUncheckedIndexedAccess` (guard or narrow before use).
- [ ] `npx tsc --noEmit` or `npm run build` passes with no errors.

## Verification

- Run **`tsc -b`** or **`npm run build`** before considering implementation complete.
- Fix all type errors; do not suppress with `// @ts-ignore` without a documented justification.

## Full Rules

For detailed patterns and examples, see:

- **Core TypeScript**: `.agentrules/typescript/generic/typescript.md`
- **Type-safe patterns**: `.agentrules/typescript/type-safe-patterns.md` (if present in project)
- **All TypeScript rule files**: listed in [reference.md](reference.md)
