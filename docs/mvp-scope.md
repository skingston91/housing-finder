# MVP scope (phase 1)

## In scope

- Web app shell (Vite + React + TypeScript + Chakra UI).
- Domain types for **search criteria** and **ranked areas**; pure **composite scoring** stub (weights documented in [architecture.md](./architecture.md)).
- **Serverless** health route and pattern for future `search-areas` (or similar).
- Documentation: product decisions, data sources, architecture, dev setup, troubleshooting.
- Cursor **agents/rules** aligned with game-collection-ts workflow (designer → implement → verify), adapted for this repo.

## Out of scope (phase 1)

- Commercial property listing APIs (e.g. Zoopla) — blocked until licensed access.
- User accounts, saved searches, alerts.
- Full National Rail / OJP SOAP integration (heavy licence/onboarding).
- Production-grade calibrated scoring models (start with transparent weighted sums).

## Near-term backlog (not committed to order)

1. Geocode workplace + define candidate area lattice inside London.
2. Land Registry / open price paid–driven **affordability** proxy (see [data-sources.md](./data-sources.md)).
3. Police.uk street crime API for **crime** subscore (category weights).
4. DfE or official open data for **school** proximity / performance.
5. Commute: driving via cost-effective routing API; transit (TFL / Google) behind serverless with caching.
