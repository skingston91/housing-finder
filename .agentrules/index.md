# Agent Rules — Housing Finder

## Required reading

| Topic | Where | Summary |
|-------|--------|---------|
| **Folder structure** | [File structure](#file-structure) + `.agentrules/typescript/contextual-folders.md` | One folder per feature; tests alongside code; public API via `index.ts`. |
| **TypeScript** | `.agentrules/typescript/` + `tsconfig.app.json` | Strict, `noUncheckedIndexedAccess`, no `any`; `tsc -b` before done. |
| **React / testing / architecture** | `.agentrules/typescript/generic/` | Linked patterns for React, tests, architecture, quality, process. |
| **Performance** | `.agentrules/typescript/generic/performance/` + `.cursor/skills/performance/SKILL.md` | Async, memoization, lists, bundle size. |

## Overview

TypeScript **React** app (Vite), **Chakra UI v3**, **Vitest**, **AWS Lambda** sources in **`lambda/`** (SAM + API Gateway). Domain types in `src/domain/`; HTTP DTOs shared with Lambda via `shared/`.

## Development standards

### TDD (red / green / refactor)

1. Clarify requirements; update `docs/` when decisions change.
2. Implement with tests; red → green → refactor.
3. Keep domain logic pure; I/O in services, hooks, and serverless handlers.

### Testing

- Prefer **data generators** in `src/test/dataGenerators/` over static fixtures.
- New **API** routes: add Lambda handlers under `lambda/`, wire routes in `template.yaml`, document `sam local` in `docs/infrastructure/aws-sam.md`, test client with mocked `fetch` where appropriate.

### TypeScript

- Strict typing, no `any`.
- Before finishing: **`npm run build`** or **`tsc -b`**.

## Before committing

- `npm run verify` passes
- No `console.log` in production code
- `docs/data-sources.md` and related docs updated when integrations or attribution change

## File structure

- **`src/`** — App, pages, components, domain, services, test utilities
- **`shared/`** — DTOs and stubs shared by Vite app and `api/` (no React imports)
- **`lambda/`** — Lambda handler sources (SAM)
- **`template.yaml`** — SAM / CloudFormation template
- **`docs/`** — Product, architecture, data sources, design specs, troubleshooting

### Component pattern

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx
└── index.ts   # re-exports only
```

Use **`.tsx`** only when the file contains JSX.

## Cursor workflow

See `.cursor/rules/new-features-workflow.mdc` — designer spec in `docs/design/` for new UX; **verifier** / `npm run verify` for substantive changes.

## Skills (`.cursor/skills/`)

| Skill | Use |
|-------|-----|
| `typescript` | Types, imports, naming, strict compiler compliance |
| `clean-code` | Names, functions, comments, errors, tests |
| `performance` | Re-renders, async, lists, bundle |
| `playwright-cli` | Browser verification (`npx playwright-cli`) |
| `follow-agent-rules` | Pre-completion checklist |
| `architect` | Read-only system design |
| `tpm` | Read-only product ideas |
