# Agent Rules Reference

Paths to all project agent rules. Read the relevant file when you need exact wording or full detail.

## Always-Applied Cursor Rules

- **New features workflow** — `.cursor/rules/new-features-workflow.mdc`  
  **Designer first** (new features): UX spec under `docs/design/` per `.cursor/agents/designer.md`. Then TDD + `.agentrules`, **verifier** for substantive changes. Data generators; app runtime **5173** (Vite) and **`sam local`** for `/api/*` (see `docs/infrastructure/aws-sam.md`).

- **Clean Code** — `.cursor/rules/clean-code.mdc`  
  Apply Clean Code on every edit. Full guidance: `.cursor/skills/clean-code/SKILL.md`.

## Development Standards (.agentrules)

- **Index** — `.agentrules/index.md`  
  TDD, testing (data generators), TypeScript (strict, build before done), file structure, serverless `api/`, before-commit checklist.

- **TypeScript** — `.agentrules/typescript/`  
  Naming, enums, default exports, **arrow functions**, **contextual folders** (code + tests in a folder, export via index.ts), generics, type-safe patterns, throwing, return types, JSDoc, etc.

- **React / Testing / Architecture / Quality / Process** — `.agentrules/typescript/generic/`  
  Linked from `.agentrules/index.md` (react.md, testing.md, architecture.md, quality.md, process.md).

## Summary

1. **New feature** → designer spec in `docs/design/` → implement (TDD, .agentrules) → verifier.
2. **All edits** → Clean Code quick check (names, functions, errors, tests).
3. **Tests** → Data generators where possible; assert on generated values.
4. **Before done** → `npm run verify` (or equivalent), no stray `console.log`.
