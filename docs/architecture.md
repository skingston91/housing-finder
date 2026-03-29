# Architecture

## High level

- **SPA** (Vite + React) for anonymous UX.
- **AWS Lambda** (sources in [`lambda/`](../lambda/), packaged by **SAM**) for geocoding, routing, crime/school/price aggregation, and anything requiring secrets or heavy CPU.
- **Clean Architecture** direction: domain and pure scoring in `src/domain/`; **ports** in `src/adapters/ports.ts`; infrastructure implementations call out to HTTP/DB from serverless (and later `src/adapters/*` if any browser-safe reads are needed).

## Dependency rule

- Inner layers **do not** import framework or I/O.
- Outer layers (API handlers, future adapter modules) depend inward on **types** and **port interfaces**.

## Scoring (phase 1)

- Subscores (0–100) per dimension: **affordability**, **commute**, **schools**, **crime** — populated by adapters (affordability/commute/schools still stubbed in the Lambda pipeline).
- **Composite** score: weighted average via `compositeScore()` in [`shared/scoring/compositeScore.ts`](../shared/scoring/compositeScore.ts), re-exported from `src/domain/scoring/compositeScore.ts` for the app. Tune weights in one place; document methodology here when we move beyond uniform defaults.

## Multi–workplace (future)

- `AreaSearchCriteria` currently uses a single `workplace`; extend to `workplaces: WorkplaceAnchor[]` and aggregate commute (e.g. min or max of per-anchor times) without rewriting scoring entry points.

## API

- **`POST /api/search-areas`** — Types in `shared/searchAreasContract.ts`. Lambda: `lambda/search-areas.ts` (validates with `shared/parseSearchAreasRequestBody.ts`, ranks via `shared/rankAreas/buildRankedAreas.ts` using **crime** from [data.police.uk](https://data.police.uk/) and affordability/schools proxies). **Transit commute:** optional **TfL** journey times when `TFL_APP_KEY` is set (`template.yaml` **Parameters** → `SearchAreasFunction` env; TfL expects **`app_key` query param only**). **Candidates:** `shared/rankAreas/workplaceGridCandidates.ts` builds a capped grid around `workplace` inside a Greater London bounding box; if the workplace is outside that box, `shared/rankAreas/candidates.ts` named centroids are used instead (`metadata.candidateMode`). Routed by **API Gateway HTTP API** in `template.yaml`.
- **`GET /api/health`** — `lambda/health.ts`.
- **`POST /api/geocode-workplace`** — `lambda/geocode-workplace.ts` (optional **Mapbox** when `MAPBOX_ACCESS_TOKEN` is set, else **Nominatim**; UK-biased; see [data-sources.md](./data-sources.md)). Response may include `geocodeProvider`.
- **Results map (SPA)** — After a successful search, **MapLibre** shows workplace and area centroids (Carto Positron style; attribution in UI). Implemented in `src/pages/AreaSearchPage/ResultsMap.tsx`, lazy-loaded from `AreaSearchPage`.
- **Client:** `src/services/searchAreasClient.ts` calls relative `/api/*` (Vite proxy to `sam local` in development).

Version the DTO if the client and server evolve separately.
