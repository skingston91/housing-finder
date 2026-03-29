# Lambda handlers (AWS)

TypeScript sources for **AWS Lambda** behind **API Gateway HTTP API**, built with **AWS SAM** + **esbuild**.

| Source                 | Route                    | Method |
| ---------------------- | ------------------------ | ------ |
| `health.ts`            | `/api/health`            | GET    |
| `search-areas.ts`      | `/api/search-areas`      | POST   |
| `geocode-workplace.ts` | `/api/geocode-workplace` | POST   |

`search-areas.ts` ranks areas via `shared/rankAreas/buildRankedAreas.ts`. Optional env on the function: **`TFL_APP_KEY`** (transit journey times), **`ORS_API_KEY`** (OpenRouteService for driving/cycling/walking). Without keys, commute uses straight-line time estimates.

`geocode-workplace.ts` uses `shared/geocoding/geocodeUkWorkplace.ts` (optional Mapbox via `MAPBOX_ACCESS_TOKEN`, else Nominatim) and `shared/geocoding/geocodeRateLimit.ts` (per-IP limit via `GEOCODE_RATE_LIMIT_PER_MINUTE`). Shared validation lives in `shared/` (e.g. `parseSearchAreasRequestBody.ts`, `parseGeocodeRequestBody.ts`).

See [docs/infrastructure/aws-sam.md](../docs/infrastructure/aws-sam.md) for local and deployed workflows.
