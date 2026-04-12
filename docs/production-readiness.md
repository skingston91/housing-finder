# Production readiness (checklist)

Use this before pointing real users at a deployed stack. Details live in linked docs.

## Build and quality gates

- [ ] **`npm run verify`** passes locally (lint, format, TypeScript, tests, Vite build).
- [ ] **`npm run verify:sam`** when changing Lambda/SAM (see [infrastructure/aws-sam.md](./infrastructure/aws-sam.md)): full verify → data checks → `sam build`.

## API and hosting

- [ ] **CORS:** `CorsAdditionalOrigin` in `sam deploy --parameter-overrides` matches your static site origin ([aws-sam.md](./infrastructure/aws-sam.md)).
- [ ] **Secrets / keys** (never commit real values):
  - [ ] **`TFL_APP_KEY`** for transit commute (TfL Journey Planner).
  - [ ] **`ORS_API_KEY`** if you rely on driving / cycling / walking routes (OpenRouteService).
  - [ ] **`MAPBOX_ACCESS_TOKEN`** optional for workplace geocode quality (see template).
- [ ] **Routing keys:** `TFL_APP_KEY` / `ORS_API_KEY` (or **`API_SECRETS_ARN`** JSON) configured for every commute mode you expose — deployed API **always** returns **400** when a mode’s key is missing ([product-decisions.md](./product-decisions.md)).
- [ ] **Health:** confirm `/api/health` (or your gateway path) after deploy.

## Data and compliance

- [ ] **Attribution:** UI copy and docs match licence requirements ([data-sources.md](./data-sources.md)).
- [ ] **Rate limits:** TfL, ORS, geocode — monitor usage; tune cache TTLs if needed.

## Observability (recommended before wide launch)

- [ ] CloudWatch logs for Lambda errors and latency.
- [ ] Alarms on 5xx or error rate (template can be extended).
- [ ] Optional: client-side error reporting (not in repo by default).

## Frontend

- [ ] Production build: `npm run build`, serve `dist/` behind HTTPS.
- [ ] Environment: Vite `VITE_*` vars documented if the app needs API base URL overrides.

## Rollback

- Keep previous SAM stack version or alias; document `sam deploy` rollback steps for your team.
