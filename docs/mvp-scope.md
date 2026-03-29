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

| Area              | Status                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **UI**            | Criteria form, results, **MapLibre** map after search (centroid popups with score breakdown), loading/error/empty states, data-source alerts, provenance copy, optional geocode-from-label |
| **API**           | `GET /api/health`, `POST /api/search-areas`, `POST /api/geocode-workplace`                                                                                                                 |
| **Affordability** | Nearest London borough vs budget; optional live **UK HPI** averages (`UKHPI_LIVE` on search Lambda) or static table; optional **max £/m²** blend; OGL metadata/UI                          |
| **Commute**       | Straight-line proxy by mode; **transit** can use **TfL Journey Planner** when `TFL_APP_KEY` is set on `SearchAreasFunction` (`shared/commute/tflJourney.ts`; TfL uses **app_key** only)    |
| **Schools**       | Phase-aware distance to **seeds + expanded** London sample (`shared/schools/`, `gias-open-data-sample` metadata)                                                                           |
| **Crime**         | data.police.uk street-level, weighted categories (`shared/policeUk/`, `shared/rankAreas/buildRankedAreas.ts`)                                                                              |
| **Candidates**    | Workplace grid inside London bounds + fallback named centroids (`shared/rankAreas/workplaceGridCandidates.ts`)                                                                             |
| **Quality**       | `npm run verify` (lint, format, tsc, tests, Vite build); SAM build separate (`npm run sam:build`)                                                                                          |

Phase 1 is **not** a substitute for conveyancing, school admissions, or routing; it is a **transparent composite** for exploration.

## Phase 2 backlog (future)

1. **Production geocoder** — **Partial:** optional **Mapbox Geocoding** when **`MAPBOX_ACCESS_TOKEN`** is set on `GeocodeWorkplaceFunction` (`shared/geocoding/geocodeUkWorkplace.ts`); otherwise Nominatim. **Per-IP rate limit** on geocode Lambda (`shared/geocoding/geocodeRateLimit.ts`, env **`GEOCODE_RATE_LIMIT_PER_MINUTE`**, default 30/min; `0` disables). **Next:** shared/ElastiCache counters across cold starts, additional providers.
2. **Land Registry** — **Partial:** live **UK HPI** borough **average** prices via **SPARQL** (one request) with JSON GET fallback + **6h** in-Lambda cache (`resolveLondonBoroughMedianRows`, `UKHPI_LIVE` on `SearchAreasFunction`). Static table fallback. **Next:** property-type-specific HPI measures, tighter SPARQL error telemetry.
3. **Schools** — **Partial:** expanded **London establishment sample** (`londonStateSchoolEstablishmentSample.ts`) + seeds; still distance-only (no performance bands). **Next:** GIAS CSV ingest, key stage metrics.
4. **Commute** — **Partial:** TfL Unified API for **transit**; **OpenRouteService** directions for **driving** / **cycling** / **walking** when **`ORS_API_KEY`** is set on `SearchAreasFunction` (`shared/commute/orsDirections.ts`, in-memory cache). **Next:** OSRM self-host, Google Directions, Secrets Manager. **Commercial hardening** (global rate limits, quotas, WAF): [commercial-release-requirements.md](./commercial-release-requirements.md).
5. **Maps** — **Partial:** **MapLibre** results map (workplace + ranked centroids), Carto **Positron** basemap, lazy-loaded chunk (`src/pages/AreaSearchPage/ResultsMap.tsx`). **List ↔ map:** selecting a result card or a map point highlights both; **map pick** scrolls the matching card into view (`block: 'nearest'`). **Popups:** click an area dot for name + overall score + dimension breakdown; workplace dot shows anchor copy; background click closes. **Next:** optional paid tiles, keyboard-accessible map inspection.

## Near-term backlog (legacy list — superseded by Phase 2 above)

The numbered items below are **historical**; see **Phase 1 status** and **Phase 2 backlog** for current truth.

1. Geocode workplace + lattice — **done** for phase 1 (Nominatim + grid).
2. Land Registry affordability — **proxy done**; live SPARQL/stats → phase 2.
3. Police.uk — **done** for phase 1.
4. DfE schools — **proxy done**; official data → phase 2.
5. Commute routing API — **proxy done**; real routing → phase 2.
