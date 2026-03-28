# Architecture

## High level

- **SPA** (Vite + React) for anonymous UX.
- **AWS Lambda** (sources in [`lambda/`](../lambda/), packaged by **SAM**) for geocoding, routing, crime/school/price aggregation, and anything requiring secrets or heavy CPU.
- **Clean Architecture** direction: domain and pure scoring in `src/domain/`; **ports** in `src/adapters/ports.ts`; infrastructure implementations call out to HTTP/DB from serverless (and later `src/adapters/*` if any browser-safe reads are needed).

## Dependency rule

- Inner layers **do not** import framework or I/O.
- Outer layers (API handlers, future adapter modules) depend inward on **types** and **port interfaces**.

## Scoring (phase 1)

- Subscores (0–100) per dimension: **affordability**, **commute**, **schools**, **crime** — populated by adapters (stubs initially).
- **Composite** score: weighted average via `compositeScore()` in `src/domain/scoring/compositeScore.ts`. Tune weights in one place; document methodology here when we move beyond uniform defaults.

## Multi–workplace (future)

- `AreaSearchCriteria` currently uses a single `workplace`; extend to `workplaces: WorkplaceAnchor[]` and aggregate commute (e.g. min or max of per-anchor times) without rewriting scoring entry points.

## API

- **`POST /api/search-areas`** — Types in `shared/searchAreasContract.ts`. Lambda: `lambda/search-areas.ts` (uses `shared/parseSearchAreasRequestBody.ts`, returns stubs via `shared/stubRankedAreas.ts`). Routed by **API Gateway HTTP API** in `template.yaml`.
- **`GET /api/health`** — `lambda/health.ts`.
- **Client:** `src/services/searchAreasClient.ts` calls relative `/api/*` (Vite proxy to `sam local` in development).

Version the DTO if the client and server evolve separately.
