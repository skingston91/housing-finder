# MVP scope (phase 1)

## In scope

- Web app shell (Vite + React + TypeScript + Chakra UI).
- Domain types for **search criteria** and **ranked areas**; **composite scoring** with documented weights ([architecture.md](./architecture.md)).
- **AWS Lambda** + API Gateway HTTP API (`template.yaml`, `lambda/`) — **health**, **`POST /api/search-areas`**, **`POST /api/geocode-workplace`**; local run via SAM ([infrastructure/aws-sam.md](./infrastructure/aws-sam.md)).
- Documentation: product decisions, data sources, architecture, dev setup, troubleshooting.
- Cursor **agents/rules** aligned with game-collection-ts workflow (designer → implement → verify), adapted for this repo.

## Out of scope (phase 1)

- Commercial property listing APIs (e.g. Zoopla) — blocked until licensed access.
- User accounts, saved searches, alerts.
- Full National Rail / OJP SOAP integration (heavy licence/onboarding).
- Production-grade calibrated scoring models (start with transparent weighted sums).

## Phase 1 status — **feature-complete** (discovery prototype)

The following is **implemented and documented** for anonymous London-first area discovery:

| Area              | Status                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI**            | Criteria form, results, **MapLibre** map after search (centroid popups with score breakdown), loading/error/empty states, data-source alerts, provenance copy, optional geocode-from-label        |
| **API**           | `GET /api/health`, `POST /api/search-areas`, `POST /api/geocode-workplace`                                                                                                                        |
| **Affordability** | Nearest London borough vs budget; optional live **UK HPI** averages (`UKHPI_LIVE` on search Lambda) or static table; optional **max £/m²** blend; OGL metadata/UI                                 |
| **Commute**       | Straight-line proxy by mode; **transit** can use **TfL Journey Planner** when `TFL_APP_KEY` is set on `SearchAreasFunction` (`shared/commute/tflJourney.ts`; TfL uses **app_key** only)           |
| **Schools**       | Phase-aware distance to **seeds + expanded** London sample (`shared/schools/`, `gias-open-data-sample-performance-seed-prototype` metadata) with a prototype performance blend from seed metadata |
| **Crime**         | data.police.uk street-level, weighted categories (`shared/policeUk/`, `shared/rankAreas/buildRankedAreas.ts`)                                                                                     |
| **Candidates**    | Workplace grid inside South East England bounds + fallback named centroids (`shared/rankAreas/workplaceGridCandidates.ts`)                                                                        |
| **Quality**       | `npm run verify` (lint, format, tsc, tests, Vite build); SAM build separate (`npm run sam:build`)                                                                                                 |

Phase 1 is **not** a substitute for conveyancing, school admissions, or routing; it is a **transparent composite** for exploration.

## Phase 2 backlog (future)

1. **Production geocoder** — **Partial:** optional **Mapbox Geocoding** when **`MAPBOX_ACCESS_TOKEN`** is set on `GeocodeWorkplaceFunction` (`shared/geocoding/geocodeUkWorkplace.ts`); otherwise Nominatim. **Per-IP rate limit** on geocode Lambda (`shared/geocoding/geocodeRateLimit.ts`, env **`GEOCODE_RATE_LIMIT_PER_MINUTE`**, default 30/min; `0` disables). **Next:** shared/ElastiCache counters across cold starts, additional providers.
2. **Land Registry** — **Partial:** live **UK HPI** borough **average** prices via **SPARQL** (one request per HPI measure) with JSON GET fallback + **6h** cache keyed by measure (`resolveLondonBoroughMedianRows`, `UKHPI_LIVE`). Single selected **property type** maps to the matching UK HPI series (e.g. flat → flat/maisonette); multiple types use all-dwellings average. **Telemetry:** structured **`ukhpi_resolution`** JSON logs (SPARQL outcome, JSON path counts, failed borough sample). **Next:** bungalow-specific series if published.
3. **Schools** — **Partial:** expanded **London establishment sample** (`londonStateSchoolEstablishmentSample.ts`, regenerable via **`npm run ingest:gias`**) + seeds with a working prototype “performance” blend (seed metadata only). **Next:** key stage metrics, performance bands from official open data.
4. **Commute** — **Partial:** TfL Unified API for **transit**; **OpenRouteService** directions for **driving** / **cycling** / **walking** when **`ORS_API_KEY`** is set on `SearchAreasFunction` (`shared/commute/orsDirections.ts`, in-memory cache). Optional **Secrets Manager** JSON via **`API_SECRETS_ARN`** (`shared/secrets/apiSecrets.ts`). **Next:** OSRM self-host, Google Directions. **Commercial hardening** (global rate limits, quotas, WAF): [commercial-release-requirements.md](./commercial-release-requirements.md).
5. **Maps** — **Partial:** **MapLibre** results map (workplace + ranked centroids), default Carto **Positron** basemap (override **`VITE_MAPLIBRE_STYLE_URL`** for MapTiler / self-hosted / other MapLibre-compatible styles), lazy-loaded chunk (`src/pages/AreaSearchPage/ResultsMap.tsx`). **List ↔ map:** selecting a result card or a map point highlights both; **map pick** scrolls the matching card into view (`block: 'nearest'`). **Popups:** click an area dot for name + overall score + dimension breakdown; workplace dot shows anchor copy; background click closes. **Keyboard:** focused map — arrows / Home / End / Escape to change selection (aligned with list order). **`aria-live`:** polite region announces selection changes (`AreaSearchPage`, `selectionAnnouncement.ts`).

## Near-term backlog (legacy list — superseded by Phase 2 above)

The numbered items below are **historical**; see **Phase 1 status** and **Phase 2 backlog** for current truth.

1. Geocode workplace + lattice — **done** for phase 1 (Nominatim + grid).
2. Land Registry affordability — **proxy done**; live SPARQL/stats → phase 2.
3. Police.uk — **done** for phase 1.
4. DfE schools — **proxy done**; official data → phase 2.
5. Commute routing API — **proxy done**; real routing → phase 2.
