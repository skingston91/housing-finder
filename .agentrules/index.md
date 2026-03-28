# Agent rules — Housing Finder

## Required reading

| Topic | Where |
|-------|--------|
| TypeScript | Strict mode; no `any`; run `tsc -b` before finishing |
| Structure | Contextual folders; public API via `index.ts`; tests alongside code |
| Testing | **Data generators** in `src/test/dataGenerators/` — avoid static fixtures where possible |
| Dependencies | Prefer builtins and small owned modules; justify new npm packages |

## Stack

- **Vite** + **React** + **Chakra UI v3**
- **Vitest** + **Testing Library** (not Jest)
- **Serverless** handlers in `api/` for secrets and heavy I/O

## Development standards

1. Clarify ambiguous requirements (update `docs/` when decisions change).
2. **TDD** where practical: red → green → refactor.
3. Domain logic stays **pure** in `src/domain/`; side effects at adapters / serverless edge.
4. No `console.log` in production paths.

## Before committing

- `npm run verify` passes
- Attribution and data-use notes updated in `docs/data-sources.md` when integrations change

## Cursor workflow

See `.cursor/rules/new-features-workflow.mdc` — designer first for new UX, verifier for substantive changes.
