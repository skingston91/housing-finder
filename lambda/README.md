# Lambda handlers (AWS)

TypeScript sources for **AWS Lambda** behind **API Gateway HTTP API**, built with **AWS SAM** + **esbuild**.

| Source                 | Route                    | Method |
| ---------------------- | ------------------------ | ------ |
| `health.ts`            | `/api/health`            | GET    |
| `search-areas.ts`      | `/api/search-areas`      | POST   |
| `geocode-workplace.ts` | `/api/geocode-workplace` | POST   |

`search-areas.ts` ranks areas via `shared/rankAreas/buildRankedAreas.ts`. Optional env: **`TFL_APP_KEY`** (transit), **`ORS_API_KEY`** (OpenRouteService for driving/cycling/walking), **`UKHPI_LIVE`** (set to **`0`** to skip live Land Registry UK HPI borough prices and use the static median table only; empty/unset enables live fetch with a 6h in-memory cache). **`API_SECRETS_ARN`** and `shared/secrets/apiSecrets.ts` optionally load those keys from **Secrets Manager** JSON when plain env is empty. **Deployed** Lambdas return **400** when the commute mode needs a key that is missing; **SAM local** can allow straight-line fallback when **`SEARCH_AREAS_ROUTING_STRICT=0`** (see `shared/searchAreas/resolveSearchAreasRoutingStrict.ts`).

`geocode-workplace.ts` uses `shared/geocoding/geocodeUkWorkplace.ts` (optional Mapbox via `MAPBOX_ACCESS_TOKEN` or **`MAPBOX_ACCESS_TOKEN`** inside the same JSON secret, else Nominatim) and `shared/geocoding/geocodeRateLimit.ts` (per-IP limit via `GEOCODE_RATE_LIMIT_PER_MINUTE`). Shared validation lives in `shared/` (e.g. `parseSearchAreasRequestBody.ts`, `parseGeocodeRequestBody.ts`).

See [docs/infrastructure/aws-sam.md](../docs/infrastructure/aws-sam.md) for local and deployed workflows.
