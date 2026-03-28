# Type placement and when to export from shared types

Only export types from a **shared** `types` file when they are **consumed in more than one place**. Use a **folder/feature** `types.ts` only when a type is used in **multiple files within that folder**. If a type is used in **one file only**, define it at the **top of that file** — do not add a local `types.ts`.

## Rule

1. **Shared types file** — Export from a root/global `types` module only types that are used in **multiple** places (e.g. across features, or by both API and frontend).
2. **One file only** — If a type is used in one file only, define it at the **top of that file** (below imports). Do **not** create a local `types.ts` for single-use types.
3. **Folder/feature only** — If a type is used in **multiple files within the same folder or feature** (and nowhere else), put it in that folder’s `types.ts`. Export from the folder’s `index.ts` only if other modules need it. Do not use a local `types.ts` when the type is used in just one file.

## Where to put types

| Consumed in | Place type |
|-------------|------------|
| **Multiple places** (across folders/features or API + frontend) | Shared `types` file (e.g. `src/types/game.ts`, `api/src/types.ts`). |
| **One file only** | Top of that file only. No local `types.ts`. |
| **Multiple files within one folder/feature** (e.g. only inside `catalog/`) | That folder’s `types.ts`. Do not put in root `types/` unless other modules need it. |

## Examples

```typescript
// ✅ GOOD: Type used only in this file — define at top of file
import type { Game } from '../types/game';

type CatalogUpdate = Partial<Pick<CatalogItem, 'title' | 'source' | 'platforms' | 'metadata'>>;

export const updateCatalog = async (gameId: GameId, updates: CatalogUpdate): Promise<void> => { ... };
```

```typescript
// ✅ GOOD: Type used in multiple handlers — can live in shared api/src/types.ts
// api/src/types.ts
export type CatalogItem = { ... };
export type GameId = string;
```

```typescript
// ❌ BAD: Single-use type exported from shared types file
// src/types/game.ts
export type GameListFilterState = { ... };  // only used in SearchFilterBar.tsx
```

```typescript
// ✅ GOOD: Single-use type — top of the only file that uses it
// SearchFilterBar/SearchFilterBar.tsx
type FilterState = { listView: 'shelf' | 'list'; ... };
```

```typescript
// ✅ GOOD: Type used by several files in the same folder — folder’s types.ts
// catalog/types.ts (used by catalog.ts and catalog.test.ts)
export type CatalogUpdate = Partial<Pick<CatalogItem, 'title' | 'source' | 'platforms' | 'metadata'>>;
```

## Re-exporting from context index

If a type is used only inside one context but you still want a clean import from the folder, export it from that context’s `index.ts`. Do not add it to a global `types/` barrel.

```typescript
// catalog/index.ts
export { getCatalogItem, putCatalog, updateCatalog } from './catalog';
export type { CatalogItem } from './catalog';  // only if other modules need CatalogItem
```

## Scope

Applies to **frontend** (`src/`), **API** (`api/src/`), and **packages**. Keeps shared type surfaces small and makes it clear where each type is used.
