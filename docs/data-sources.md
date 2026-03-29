# Data sources, licensing, and attribution

Keep this file updated whenever we add or change an integration. **Do not ship without meeting each provider’s terms.**

## Principles

- Prefer **official open data** and documented APIs.
- Centralise **attribution** strings the UI or “About data” panel can render.
- Serverless functions hold **secrets** (API keys); never expose in `VITE_*` unless the provider explicitly allows public keys with domain restrictions.

## Access model & alternatives (summary)

Rough guide for **non-commercial / hobby** vs **commercial or restricted** sources and what to use instead. **Always confirm** current terms on the provider’s site.

| Integration                                     | Typical access                                                                                                                                                                              | Notes                                                                                   | Alternatives if this doesn’t fit                                                                                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **TfL Unified API** (transit commute)           | **Free** registration; use **`app_key`** as the **only** query parameter on requests (**do not send `app_id`** — TfL no longer requires it).                                                | Fair-use / terms apply; not “unlimited enterprise”.                                     | **Commercial / other routing:** Google Maps Platform (Directions), Mapbox Directions, HERE Routing; **self-host / OSS:** OSRM, Valhalla (you operate infra). **National rail:** National Rail OJP feeds (licensed onboarding, not drop-in free). |
| **OpenRouteService** (drive / cycle / walk)     | **Free** registration; API key; [terms](https://openrouteservice.org/terms-of-service/) and quotas apply.                                                                                   | Used when **`ORS_API_KEY`** is on `SearchAreasFunction`; **not** for transit (use TfL). | **Alternatives:** Mapbox Directions, HERE, Google, self-host OSRM/Valhalla.                                                                                                                                                                      |
| **data.police.uk** (crime)                      | **Open** data API; no key.                                                                                                                                                                  | Rate responsibly; anonymised locations.                                                 | No equivalent single UK-wide free API for the same thing; bespoke police force APIs vary.                                                                                                                                                        |
| **Nominatim** (geocode workplace)               | **Not** a commercial “free tier” — **usage policy** (low volume, identify app). **Optional Mapbox** in-app when `MAPBOX_ACCESS_TOKEN` is configured (see SAM docs).                         | Heavy or production traffic should **not** rely on the public instance.                 | **Hosted geocoders (often freemium then paid):** OpenCage, LocationIQ, Geoapify. **Major cloud (paid):** Google Geocoding, Mapbox Geocoding, AWS Location Service. **Self-host:** Nominatim, Pelias (your servers).                              |
| **UK HPI / borough benchmarks** (affordability) | **Optional live** JSON from Land Registry linked-data API (`SearchAreasFunction`, env **`UKHPI_LIVE`**: unset or non-`0` = on; **`0`** = static table only). Cached **6h** per warm Lambda. | UK HPI is **average** prices, not medians; discovery only.                              | **Same source:** [UK HPI linked data](https://landregistry.data.gov.uk/app/ukhpi/doc/); SPARQL endpoint also available. **Paid:** commercial indices / AVMs.                                                                                     |
| **School seeds** (schools proxy)                | **No API** — small static coordinate set.                                                                                                                                                   | Illustrative only.                                                                      | **Free / official:** DfE open data, Get Information about Schools (GIAS) exports. **Paid:** education data vendors.                                                                                                                              |
| **Straight-line commute**                       | **Local** geometry; no provider.                                                                                                                                                            | Fallback when TfL/ORS unavailable or no route; crude vs real networks.                  | **When configured:** OpenRouteService for drive/cycle/walk (see row above); **paid:** Google, Mapbox, HERE; **self-host:** OSRM, Valhalla.                                                                                                       |
| **Property listings** (Zoopla, Rightmove, etc.) | **Commercial** APIs / licences.                                                                                                                                                             | Not used in phase 1.                                                                    | **Free-ish for research:** Land Registry **sold prices** (not live listings); portal sites manually.                                                                                                                                             |
| **Google Maps Platform**                        | **Commercial** (billing account; credits may apply for new accounts).                                                                                                                       | Not wired in this repo yet.                                                             | Mapbox, HERE, TomTom, Apple MapKit (where licensed), OSM-based stacks above.                                                                                                                                                                     |
| **Map tiles (results map)**                     | **Carto basemaps** (Positron GL style) over **OpenStreetMap** — check [CARTO](https://carto.com/basemaps/) / OSM attribution requirements.                                                  | Used for discovery map only; not a routing engine.                                      | **Alternatives:** MapTiler, Mapbox, Protomaps, OS-derived tile schemes per licence.                                                                                                                                                              |

## Sources under consideration

### HM Land Registry (linked data / SPARQL)

- **URL:** [landregistry.data.gov.uk](https://landregistry.data.gov.uk/) — [UK HPI about](https://landregistry.data.gov.uk/app/ukhpi/doc/)
- **Use:** Sold prices, transaction history, area-level aggregates (not current listings).
- **Licence:** Open Government Licence — [OGL](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
- **Attribution (example):** Contains public sector information licensed under the Open Government Licence v3.0.
- **Implementation:** `shared/affordability/londonBoroughMedians.ts` keeps **borough names and representative centroids** (nearest-borough matching). **Prices:** when **`UKHPI_LIVE`** is enabled on `SearchAreasFunction` (default in `template.yaml`; set to **`0`** to disable), `shared/affordability/resolveLondonBoroughMedianRows.ts` loads the latest **UK HPI average** per borough via **one SPARQL POST** (`shared/affordability/ukhpiSparql.ts`), then **per-borough linked-data JSON** (`shared/affordability/ukhpiLinkedDataApi.ts`) for gaps. **`ukhpiAveragePriceKeyForPropertyTypes`** maps a **single** selected `propertyTypes[]` entry to the matching HPI field (e.g. `averagePriceFlatMaisonette`); **multiple** types use **`averagePrice`** (all dwelling types). **Caches 6 hours** per measure key. Metadata adds **`ukhpiPriceMeasure`**. On total failure, scoring falls back to static medians in-repo. Optional **max £/m²** is still blended in `affordabilityScoreForAreaSearch`. **Note:** UK HPI publishes **averages**, not medians — the score remains a transparent heuristic.
- **Alternatives (commercial):** paid property analytics / AVM feeds; portal APIs where licensed.

### HM Land Registry — Use land and property data API

- **URL:** [API documentation](https://use-land-property-data.service.gov.uk/api-documentation)
- **Use:** Bulk datasets (e.g. corporate ownership) — may be secondary to MVP; account + dataset licence required.
- **Note:** Download URLs are short-lived; batch jobs belong in serverless/cron, not the browser.
- **Alternatives:** OGL bulk downloads without this API where sufficient; commercial data vendors for curated packs.

### Police.uk — Street-level crime

- **URL:** [Street-level crimes](https://data.police.uk/docs/method/crime-street/)
- **Use:** Approximate crime counts by category near a point or polygon; **not exact locations**.
- **Implementation:** `shared/policeUk/streetCrimes.ts` and `shared/rankAreas/buildRankedAreas.ts` (called from `lambda/search-areas.ts`). Each ranked area uses a fixed candidate centroid; responses include `metadata.dataPoliceUk` for UI attribution.
- **Attribution:** Follow [data.police.uk](https://data.police.uk/) terms; surface anonymisation caveats in UI help text.
- **Caveat:** Scotland coverage differs (BTP-only nuance per their docs).
- **Alternatives:** None universal and free in the same shape; local force open data where published.

### Department for Education — School performance

- **URL:** [Compare school performance](https://www.compare-school-performance.service.gov.uk/) (human-facing); prefer **official open data** downloads/APIs where available for automation.
- **Use:** Distance to good schools, phase filters, performance bands.
- **Risk:** Scraping the website is fragile; plan ingestion from **published open data** files or APIs only.
- **Implementation (phase 2 partial):** `shared/schools/londonSchoolPointsForRanking.ts` combines original seeds with `londonStateSchoolEstablishmentSample.ts` (extra London coordinates in the **GIAS / DfE open-data family**, OGL). Scoring: `schoolsScoreFromEstablishmentPoints` (distance + phase match). Metadata `schoolsModel: gias-open-data-sample`. Ingest the full **Get Information about Schools** CSV when you need exhaustive coverage.
- **Alternatives (commercial):** third-party education data products; **official:** GIAS, DfE statistical releases.

### Property listings (Zoopla, Rightmove, etc.)

- **Status:** **Not used** until commercial/developer access is approved.
- **URL (reference):** [Zoopla developers](https://developers.zoopla.co.uk/)
- **Alternatives:** Land Registry sold prices (OGL) for history; manual research; licensed listing feeds when approved.

### Routing and geocoding

- **OpenStreetMap Nominatim** ([usage policy](https://operations.osmfoundation.org/policies/nominatim/)): default forward geocode for the workplace label via **`POST /api/geocode-workplace`** (`lambda/geocode-workplace.ts`, `shared/geocoding/nominatim.ts`). **Low volume only** — identify with `User-Agent`; do not bulk or scrape.
- **Mapbox Geocoding API** ([docs](https://docs.mapbox.com/api/search/geocoding/)): when **`MAPBOX_ACCESS_TOKEN`** is set on the geocode Lambda, **`shared/geocoding/geocodeUkWorkplace.ts`** tries Mapbox first (`country=gb`, `limit=1`), then falls back to Nominatim on error or empty results. Response may include `geocodeProvider: "mapbox" \| "nominatim"`. Follow Mapbox terms and quotas; token is server-side only.
- **Alternatives (geocoding):** see table above (LocationIQ, Google, self-hosted Nominatim/Pelias, etc.).
- **Google Maps Platform** ([Directions](https://developers.google.com/maps/documentation/directions/), [@googlemaps/google-maps-services-js](https://github.com/googlemaps/google-maps-services-js)): **commercial**; server-side only if adopted.
- **Alternatives (routing):** TfL (London transit, free key), OSRM, Valhalla, OpenRouteService (check ToS), Mapbox, HERE, Google.

### Commute (straight-line proxy + TfL + optional OpenRouteService)

- **Straight-line heuristic:** `shared/commute/commuteScoreFromStraightLine.ts` — distance × assumed mode speed when not using a routing API. Metadata: `commuteModel: straight-line-time-estimate`.
- **Transport for London (transit):** [Unified API](https://api.tfl.gov.uk/) — `shared/commute/tflJourney.ts` calls **Journey Planner** when commute mode is **transit** and **`TFL_APP_KEY`** is set on the search Lambda. Responses are **cached in memory** per Lambda instance (rounded endpoints, TTL, capped entries) to cut repeat calls during a warm container. Requests append **`app_key`** as a query parameter only (**ignore `app_id`**; TfL no longer requires it). Metadata: `commuteModel: tfl-unified-api` or `tfl-fallback-straight-line`. Follow TfL registration and fair-use terms; keys are server-side only.
- **OpenRouteService (driving / cycling / walking):** [Directions API v2](https://openrouteservice.org/dev/#/api-docs/v2/directions/%7Bprofile%7D/post) — `shared/commute/orsDirections.ts` POSTs coordinates to **`/v2/directions/{profile}/json`** (`driving-car`, `cycling-regular`, `foot-walking`) when mode is **driving**, **cycling**, or **walking** and **`ORS_API_KEY`** is set on the search Lambda (`Authorization` header). Parsed **`routes[0].summary.duration`** (seconds → minutes). **Cached** like TfL (warm Lambda). Metadata: `openrouteservice-directions` or `openrouteservice-fallback-straight-line`. Register at [openrouteservice.org](https://openrouteservice.org/); respect quotas and terms.
- **Alternatives:** see summary table (paid global routing APIs; self-hosted OSRM/Valhalla; licensed national-rail feeds).

### Schools (phase 1 proxy)

- **Seed proximity:** `shared/schools/londonSchoolSeeds.ts` — small reference coordinate set; `metadata.schoolsModel: seed-school-distance`. Not DfE performance data; replace with official open data when available.
- **Alternatives:** DfE open data, GIAS; commercial school-location products.

### National Rail — OJP / RTJP

- **URL:** [Online Journey Planner data feeds](https://www.nationalrail.co.uk/developers/online-journey-planner-data-feeds/)
- **Use:** National rail journey planning (SOAP, formal licence, batch onboarding).
- **MVP:** Likely **deferred** in favour of simpler commute proxies.
- **Alternatives:** TfL + straight-line for London-first; commercial journey APIs for national multi-modal.

## Maps (display)

- **Implemented (phase 2 slice):** **MapLibre GL** with **Carto Positron** vector style (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`) in `src/pages/AreaSearchPage/ResultsMap.tsx` — workplace (red) and ranked area centroids (blue). Basemap attribution: **© OpenStreetMap contributors © CARTO** (also surfaced in UI copy).
- **Future:** richer map popups, optional commercial tiles (Mapbox, MapTiler, etc.) where licence allows.
