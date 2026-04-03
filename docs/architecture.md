# Architecture

## High level

- **SPA** (Vite + React) for anonymous UX.
- **AWS Lambda** (sources in [`lambda/`](../lambda/), packaged by **SAM**) for geocoding, routing, crime/school/price aggregation, and anything requiring secrets or heavy CPU.
- **Clean Architecture** direction: domain and pure scoring in `src/domain/`; **ports** in `src/adapters/ports.ts` (see `.cursor/agents/architect.md`); **browser adapters** in `src/adapters/*` implement those ports and call `src/services/*` (HTTP to `/api/*`). **Lambda** remains the server-side composition root for ranking; shared DTOs live in `shared/*` and are mapped to domain types at the SPA adapter boundary (`src/adapters/mapSearchAreasContract.ts`).

## Dependency rule

- Inner layers **do not** import framework or I/O.
- Outer layers (API handlers, `src/adapters/*`) depend inward on **types** and **port interfaces**.
- The area search page depends on **`AreaDiscoveryPort`** and **`WorkplaceGeocodePort`** via **`httpAreaDiscoveryAdapter`** and **`httpWorkplaceGeocodeAdapter`**, not on `postSearchAreas` / `postGeocodeWorkplace` directly.

## Scoring (phase 1)

- Subscores (0–100) per dimension: **affordability**, **commute**, **schools**, **crime** — composed in `buildRankedAreas` from police.uk, optional UK HPI / TfL / ORS, and school distance samples.
- **Composite** score: weighted average via `compositeScore()` in [`shared/scoring/compositeScore.ts`](../shared/scoring/compositeScore.ts), re-exported from `src/domain/scoring/compositeScore.ts` for the app. Tune weights in one place; document methodology here when we move beyond uniform defaults.

## Multi–workplace (future)

- `AreaSearchCriteria` currently uses a single `workplace`; extend to `workplaces: WorkplaceAnchor[]` and aggregate commute (e.g. min or max of per-anchor times) without rewriting scoring entry points.

## API

- **`POST /api/search-areas`** — Types in `shared/searchAreasContract.ts`. Lambda: `lambda/search-areas.ts` (validates with `shared/parseSearchAreasRequestBody.ts`, ranks via `shared/rankAreas/buildRankedAreas.ts` using **crime** from [data.police.uk](https://data.police.uk/)). **Affordability:** optional live **UK HPI** borough averages when `UKHPI_LIVE` is not `0` on `SearchAreasFunction` (**SPARQL** batch + JSON fallback per borough, `resolveLondonBoroughMedianRows`, 6h cache per HPI measure; single property type → type-specific UK HPI average); else static borough table. **Schools:** distance to seeds + expanded sample. **Transit commute:** optional **TfL** when `TFL_APP_KEY` is set (`template.yaml` **Parameters** → `SearchAreasFunction` env; TfL expects **`app_key` query param only**). **Drive / cycle / walk:** optional **OpenRouteService** when `ORS_API_KEY` is set (same function). Otherwise commute uses straight-line time estimates unless **`SEARCH_AREAS_ROUTING_STRICT=1`**, in which case the handler returns **400** when the required key for the selected mode is missing. Successful TfL journeys may apply a small **reliability** down-scale (`commuteReliabilityFactor`) when disruption is flagged or a second route is much slower. **Candidates:** `shared/rankAreas/workplaceGridCandidates.ts` builds a capped grid around `workplace` inside a Greater London bounding box; if the workplace is outside that box, `shared/rankAreas/candidates.ts` named centroids are used instead (`metadata.candidateMode`). Routed by **API Gateway HTTP API** in `template.yaml`.
- **`GET /api/health`** — `lambda/health.ts`.
- **`POST /api/geocode-workplace`** — `lambda/geocode-workplace.ts` (optional **Mapbox** when `MAPBOX_ACCESS_TOKEN` is set, else **Nominatim**; UK-biased; see [data-sources.md](./data-sources.md)). Response may include `geocodeProvider`.
- **Results map (SPA)** — After a successful search, **MapLibre** shows workplace and area centroids (Carto Positron style; attribution in UI). Implemented in `src/pages/AreaSearchPage/ResultsMap.tsx`, lazy-loaded from `AreaSearchPage`.
- **Client:** `src/services/searchAreasClient.ts` calls relative `/api/*` (Vite proxy to `sam local` in development).

Version the DTO if the client and server evolve separately.
