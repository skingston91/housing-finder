# Type reuse and propagation

Reuse types from a **single source of truth** so that when a type changes, the change propagates everywhere. Prefer `Pick`, `Partial`, `Required`, and `Omit` over duplicating or redefining shapes.

## Rule

1. **Derive from domain types** — When a value is a subset or variation of an existing type, derive it from that type instead of defining a new inline shape.
2. **Use utility types** — Use `Pick<T, K>`, `Partial<T>`, `Required<T>`, `Omit<T, K>` so the relationship is explicit and changes to the source type flow through.
3. **One place to change** — If you add or rename a field on the source type, call sites and derived types should stay correct without manual updates.

## Pick — subset of properties

Use when you need **only some keys** of a type (e.g. payloads, update shapes, API request bodies).

```typescript
// ✅ GOOD: Single source of truth; adding a field to CatalogItem updates CatalogUpdate
type CatalogItem = {
  pk: string;
  sk: string;
  gameId: GameId;
  title: string;
  source: string;
  platforms: string;
  metadata?: GameMetadata;
};

/** Updatable fields only; excludes keys. */
type CatalogUpdate = Partial<Pick<CatalogItem, 'title' | 'source' | 'platforms' | 'metadata'>>;

/** Create payload: required catalog fields. */
type PutCatalogAttrs = Required<Pick<CatalogItem, 'title' | 'source' | 'platforms'>> &
  Partial<Pick<CatalogItem, 'metadata'>>;
```

```typescript
// ❌ BAD: Duplicated shape; changing CatalogItem won't update this
type CatalogUpdate = {
  title?: string;
  source?: string;
  platforms?: string;
  metadata?: GameMetadata;
};
```

## Partial and Required

- **`Partial<T>`** — All properties optional. Use for update payloads or optional overrides.
- **`Required<T>`** — All properties required. Use when a type is usually optional but you need a guaranteed subset (e.g. create payloads).

```typescript
// ✅ GOOD: Reuse and make optional/required
type Game = { id: string; title: string; source: string; platforms: string };
type GameUpdate = Partial<Pick<Game, 'title' | 'source' | 'platforms'>>;
type GameCreate = Required<Pick<Game, 'title' | 'source' | 'platforms'>>;
```

## Omit — exclude keys

Use when you need a type **without** certain keys (e.g. "Game without id").

```typescript
// ✅ GOOD: Derive "input" shape from full type
type GameInput = Omit<Game, 'id'>;
```

## Parameters and ReturnType

Reuse function signatures so handler types stay in sync with implementation.

```typescript
// ✅ GOOD: Catalog updates type is whatever updateCatalog accepts
const catalogUpdates: Parameters<typeof updateCatalog>[1] = {};
// Adding a new updatable field to updateCatalog updates this type automatically.
```

## When to reuse

- **API request/response shapes** — Derive from shared contract or domain types (e.g. `Pick<Game, 'title' | 'source'>`).
- **Update payloads** — `Partial<Pick<SourceType, 'field1' | 'field2'>>`.
- **Create payloads** — `Required<Pick<SourceType, 'a' | 'b'>>` (and optional fields via `Partial<Pick<...>>` if needed).
- **Handler/function params** — `Parameters<typeof fn>[N]` when you want call sites to stay in sync with the function.

## When duplication is acceptable

- One-off local types for a single component or test.
- Types that are intentionally different from the domain (e.g. UI-only state that doesn't map 1:1 to the API).

## Scope

Applies to **frontend** (`src/`), **API** (`api/src/`), and **packages** (e.g. contract). Prefer deriving from `@game-collection/contract` or shared domain types where they exist.
