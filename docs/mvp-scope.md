# MVP scope (phase 1)

## In scope

- Web app shell (Vite + React + TypeScript + Chakra UI).
- Domain types for **search criteria** and **ranked areas**; pure **composite scoring** stub (weights documented in [architecture.md](./architecture.md)).
- **AWS Lambda** + API Gateway HTTP API (`template.yaml`, `lambda/`) — health + `search-areas` stub; local run via SAM (see [infrastructure/aws-sam.md](./infrastructure/aws-sam.md)).
- Documentation: product decisions, data sources, architecture, dev setup, troubleshooting.
- Cursor **agents/rules** aligned with game-collection-ts workflow (designer → implement → verify), adapted for this repo.

## Out of scope (phase 1)

- Commercial property listing APIs (e.g. Zoopla) — blocked until licensed access.
- User accounts, saved searches, alerts.
- Full National Rail / OJP SOAP integration (heavy licence/onboarding).
- Production-grade calibrated scoring models (start with transparent weighted sums).

## Near-term backlog (not committed to order)

1. Geocode workplace + define candidate area lattice inside London — **partial:** grid + **`POST /api/geocode-workplace`** (Nominatim) fills lat/lng from the label; production geocoder TBD.
2. Land Registry / open price paid–driven **affordability** proxy — **partial:** indicative **borough median** table + nearest-borough match (see [data-sources.md](./data-sources.md)); SPARQL/live stats later.
3. Police.uk street crime API for **crime** subscore (category weights) — **wired** in Lambda + UI attribution and provenance copy.
4. DfE or official open data for **school** proximity / performance — **partial:** seed-school distance proxy only (`shared/schools/`).
5. Commute: driving via cost-effective routing API; transit (TFL / Google) behind serverless with caching — **partial:** straight-line time estimate by mode (`shared/commute/commuteScoreFromStraightLine.ts`).
