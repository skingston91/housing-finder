# Lambda handlers (AWS)

TypeScript sources for **AWS Lambda** behind **API Gateway HTTP API**, built with **AWS SAM** + **esbuild**.

| Source                 | Route                    | Method |
| ---------------------- | ------------------------ | ------ |
| `health.ts`            | `/api/health`            | GET    |
| `search-areas.ts`      | `/api/search-areas`      | POST   |
| `geocode-workplace.ts` | `/api/geocode-workplace` | POST   |

`geocode-workplace.ts` uses `shared/geocoding/geocodeUkWorkplace.ts` (optional Mapbox via `MAPBOX_ACCESS_TOKEN`, else Nominatim). Shared validation lives in `shared/` (e.g. `parseSearchAreasRequestBody.ts`, `parseGeocodeRequestBody.ts`).

See [docs/infrastructure/aws-sam.md](../docs/infrastructure/aws-sam.md) for local and deployed workflows.
