# Contextual folders and index exports

Group related code and tests under a **contextual folder**, and expose a single public API via **index.ts**. This keeps imports short and makes boundaries clear.

## Rule

1. **One folder per context** — Put all code and tests for a given concern in a folder named after that concern (e.g. `catalog/`, `userGames/`, `merge/`).
2. **Tests live alongside the code** — Put test files in the same folder as the code they cover: `contextName.test.ts` or `contextName.test.tsx` next to `contextName.ts`. Do **not** use a `__tests__/` subfolder; keep tests grouped with the code.
3. **Public API via index.ts** — Export only from the folder’s `index.ts`. No implementation in `index.ts`; re-export from the implementation file(s). Consumers import from the folder path, not from the implementation file.

## Folder layout

```
contextName/
├── index.ts              # Re-export public API only (no implementation)
├── contextName.ts        # Implementation (or split into multiple files)
├── contextName.test.ts   # Tests — same folder as code, no __tests__ subfolder
└── types.ts              # Optional: types used only in this context
```

For components (React): `ComponentName/ComponentName.tsx`, `ComponentName.test.tsx` (same folder), `index.ts` (re-export). Do not use `__tests__/`; keep test files next to the component.

## Index file

- **Only re-exports.** No logic, no default implementation in `index.ts`.
- Export what the rest of the app or package needs: functions, types, classes, constants.

```typescript
// ✅ index.ts — re-export only
export { getCatalog, putCatalogItem, deleteCatalogItem } from './catalog';
export type { CatalogItem } from './catalog';

// ❌ index.ts — no implementation
const getCatalog = () => { ... };
export { getCatalog };
```

## Imports

- **From outside the folder:** Import from the **folder** (the index), not from the implementation file.

```typescript
// ✅ Short, stable import
import { getCatalog, putCatalogItem } from '../catalog';
import type { CatalogItem } from '../catalog';

// ❌ Long, brittle import (tied to internal file name)
import { getCatalog } from '../catalog/catalog';
```

- **Inside the folder:** Implementation and tests may import from the implementation file (e.g. `./catalog`) or from `./index` as needed.

## When to add a contextual folder

- **New feature or domain** — e.g. catalog, userGames, merge, rawg.
- **Refactors** — When splitting a large file or module, group the new pieces under one folder and export from `index.ts`.
- **Existing flat files** — Prefer migrating to a folder when you touch the area (e.g. `catalog.ts` → `catalog/catalog.ts` + `catalog/index.ts`), so the rest of the codebase can use `from './catalog'`.

## Scope

- Applies to **frontend** (`src/`), **API** (`api/src/`), and any other package in the repo.
- Components already follow a similar pattern (component folder + index re-export); this rule generalizes it to non-UI code and keeps index-only exports and short import paths as the standard.
