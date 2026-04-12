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
- **Price momentum (optional):** `shared/affordability/resolveLondonBoroughYoY.ts` can compute **year-on-year % change** in the same borough average series (latest month vs the same calendar month one year earlier), then **scale that percentage relative to other candidates in the same search** to a 0–100 **price momentum** dimension. The UI may blend this into the composite total when **`scoring.includePriceTrendInComposite`** is set on `POST /api/search-areas`. This is **not** a forecast—only recent published trend vs last year’s published level. Requires live UK HPI (SPARQL latest map); otherwise the dimension shows neutral scores.
- **Alternatives (commercial):** paid property analytics / AVM feeds; portal APIs where licensed.

### HM Land Registry — Use land and property data API

- **URL:** [API documentation](https://use-land-property-data.service.gov.uk/api-documentation)
- **Use:** Bulk datasets (e.g. corporate ownership) — may be secondary to MVP; account + dataset licence required.
- **Note:** Download URLs are short-lived; batch jobs belong in serverless/cron, not the browser.
- **Alternatives:** OGL bulk downloads without this API where sufficient; commercial data vendors for curated packs.

### Schools — GIAS ingest

The ranking sample (`shared/schools/londonStateSchoolEstablishmentSample.ts`) can be regenerated from the official **Get Information about Schools** CSV using **`npm run ingest:gias`** — see [`scripts/README.md`](../scripts/README.md).

### Police.uk — Street-level crime

- **URL:** [Street-level crimes](https://data.police.uk/docs/method/crime-street/)
- **Use:** Approximate crime counts by category near a point or polygon; **not exact locations**.
- **Implementation:** `shared/policeUk/streetCrimes.ts` (retries on **429 / 502 / 503 / 504**) and `shared/rankAreas/buildRankedAreas.ts` (called from `lambda/search-areas.ts`). Each ranked area uses a fixed candidate centroid; responses include `metadata.dataPoliceUk` for UI attribution. **Per month:** failures are skipped where possible; the crime subscore averages **successful months only**. If **no** month loads, the area uses a **conservative placeholder** crime subscore (`shared/crime/crimeScoreWhenPoliceUnavailable.ts`, below neutral 50); `metadata.policeUk: 'error'`, `crimeDataAvailable: 0`. If **some** months load, `metadata.policeUk: 'partial'`, `crimeMonthsPartial` counts failed months, and the UI notes partial data (not the full-window fallback).
- **Attribution:** Follow [data.police.uk](https://data.police.uk/) terms; surface anonymisation caveats in UI help text.
- **Caveat:** Scotland coverage differs (BTP-only nuance per their docs).
- **Alternatives:** None universal and free in the same shape; local force open data where published.

### Department for Education — School performance

- **URL:** [Compare school performance](https://www.compare-school-performance.service.gov.uk/) (human-facing); prefer **official open data** downloads/APIs where available for automation.
- **Use:** Distance to good schools, phase filters, performance bands.
- **Risk:** Scraping the website is fragile; plan ingestion from **published open data** files or APIs only.
- **Implementation (phase 2 partial):** `shared/schools/londonSchoolPointsForRanking.ts` combines seeds with `londonStateSchoolEstablishmentSample.ts` (GIAS-style coordinates, OGL). Optional **`urn`** on points (from `ingest:gias`) joins **`LONDON_SCHOOL_PERFORMANCE_BY_URN`** produced by `npm run ingest:dfe` (`mergePerformanceIntoSchoolSeeds`). Scoring: `schoolsScoreFromEstablishmentPoints` (distance + phase + `performanceByPhase`). Metadata: `schoolsModel` (`gias-open-data-sample-dfe-performance-urn-map` vs `…-performance-seed-prototype`), **`schoolsDataAttribution`**, optional **`schoolsPerformanceAcademicYear`**, plus join-quality fields **`schoolsPointsWithUrn`**, **`schoolsPointsMatchedByUrn`**, **`schoolsPerformanceCoveragePct`**. Ingest also generates `londonSchoolPerformanceManifest.ts` and `londonSchoolPerformanceManifest.json` (same payload; JSON is what `npm run check:dfe-manifest` / `verify:data` read) with row-level quality counters and candidate unmapped metric columns.
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
- **Transport for London (transit):** [Unified API](https://api.tfl.gov.uk/) — `shared/commute/tflJourney.ts` calls **Journey Planner** when commute mode is **transit** and **`TFL_APP_KEY`** is set on the search Lambda. **Duration scoring** uses the **median** of the **first up to three** qualifying journeys returned (after filters such as avoided lines), not only the first journey — metadata `commuteTflDurationMethod: median-first-three-qualifying`. A one-line **planner slot** summary (`commuteTflPlannerSummary`) is produced by `shared/commute/tflPlannerSummary.ts` for the UI. Planner **`mode`** includes tube, bus, DLR, tram, Overground, TfL Rail, Elizabeth line, **national-rail**, and walking. Resilience: **request timeout** (default **15s** per attempt) or **429 / 502 / 503 / 504** → one retry after a short delay; other **HTTP errors** retry with modes **without national-rail** (not **429**, to avoid extra quota use); **empty journeys** retry with **`nationalSearch=true`**. Optional **`date` / `time` / `timeIs`**, **`maxWalkingMinutes`**, **`maxTransferMinutes`** come from **`commute.transit`**. **`useRealTimeLiveArrivals=false`** and **`walkingSpeed=average`** are always sent. When **`date`/`time`** are omitted from the request and **`omitDefaultPlannerDeparture`** is not set, the app injects the next eligible **weekday 08:30 Europe/London** departure (`shared/commute/tflDefaultLondonDeparture.ts`) so scores match a **normal** commuter slot rather than “right now”. **Successful** planner responses are **cached** per Lambda (rounded endpoints, TTL, capped size); **failures are not** cached. **`buildRankedAreas`** caps **concurrent** TfL Journey calls. **`app_key`** query only (**ignore `app_id`**). Metadata: `commuteModel`, plus optional `commuteTflNationalSearchUsed`, `commuteAlternativeJourneyMinutes`, `commuteTflDisruptionHint`, `commuteTflFailureCode`. Follow TfL terms; keys are server-side only.
- **OpenRouteService (driving / cycling / walking):** [Directions API v2](https://openrouteservice.org/dev/#/api-docs/v2/directions/%7Bprofile%7D/post) — `shared/commute/orsDirections.ts` POSTs coordinates to **`/v2/directions/{profile}/json`** (`driving-car`, `cycling-regular`, `foot-walking`) when mode is **driving**, **cycling**, or **walking** and **`ORS_API_KEY`** is set on the search Lambda (`Authorization` header). Parsed **`routes[0].summary.duration`** (seconds → minutes). **Cached** like TfL (warm Lambda). Metadata: `openrouteservice-directions` or `openrouteservice-fallback-straight-line`. Register at [openrouteservice.org](https://openrouteservice.org/); respect quotas and terms.
- **Strict routing:** **Deployed** Lambdas always reject missing keys for the selected commute mode (**400**). **SAM local** uses `SEARCH_AREAS_ROUTING_STRICT` (`1` = enforce; `0` = straight-line fallback with console warnings). See `shared/searchAreas/validateSearchAreasRoutingKeys.ts` and `shared/searchAreas/resolveSearchAreasRoutingStrict.ts`.
- **Reliability adjustment (TfL):** When a TfL journey succeeds, `shared/commute/applyCommuteReliabilityAdjustments.ts` may slightly lower the commute dimension score if TfL flags **disruption** on the chosen journey or if a **second** acceptable journey is much slower (route volatility). Metadata may include **`commuteReliabilityFactor`** (product of multipliers, below 1 when applied).
- **Alternatives:** see summary table (paid global routing APIs; self-hosted OSRM/Valhalla; licensed national-rail feeds).

### Planned transport (Greater London spike)

- **Purpose:** Show **metadata-only** proximity to **curated illustrative waypoints** for **publicly discussed** Greater London transport schemes (TfL / GLA / national project pages linked per result). Uses **straight-line (haversine) distance** to the nearest in-repo point — **not** live Journey Planner, **not** committed opening dates, **not** engineering alignment.
- **Implementation:** `shared/futureTransport/londonPlannedTransportPoints.ts` (waypoints + source URLs; **`LONDON_PLANNED_TRANSPORT_DATA_LAST_REVIEWED`** — bump when curating), `shared/futureTransport/plannedTransportProximityForPoint.ts` (nearest point + 0–100 falloff over ~8 km for **display**). Metadata includes **`futureTransportDataLastReviewed`** (ISO date) for UI. Wired in `shared/rankAreas/buildRankedAreas.ts` as `metadata.futureTransport*`. **Not** blended into the headline composite score unless product explicitly adds a weight later.
- **Licence / terms:** Follow each linked **scheme** page (TfL, HS2, Heathrow, GLA, etc.); waypoints are **approximate** area centres for discovery — replace with OGL geometry before any production promise.

### Internal floor area — second score (London)

- **Purpose:** Optional **second score** (`breakdown.sizeFit`, 0–100) comparing the user’s **minimum internal floor area** (m²) to **typical** m² for **each selected property type**, derived from **bundled MHCLG domestic EPC open-data medians** (borough × type) when sample size allows, with an **honest fallback** to an **inner vs outer London illustration** (`shared/sizeFit/heuristicTypicalFloorM2.ts`). **Not** blended into the headline composite. **No live EPC HTTP calls per search**—only an offline-generated table checked into the repo.
- **Implementation:** `shared/sizeFit/resolveTypicalFloorM2ForBorough.ts` (≥20 certificates per cell to trust an EPC median; matches ingest), `shared/sizeFit/sizeFitHeadroomRatio.ts`, `shared/sizeFit/normalizeSizeFitRatiosToScores.ts`. Bundled table: `shared/sizeFit/londonBoroughEpcMedianFloorM2.generated.ts` (empty until `npm run ingest:epc-london-medians`). Row→type rules: `shared/sizeFit/epcCertificateRowClassification.ts` (must stay aligned with `scripts/ingest-epc-london-floor-medians.mjs`). Request: `sizeFit: { minFloorAreaM2 }` on `POST /api/search-areas`. Metadata: `sizeFitModel` (`london-mhclg-epc-median-v1` | `heuristic-inner-outer-london-v1` | `not-requested`), `sizeFitTypicalM2Coverage` (`epc-full` | `epc-partial` | `heuristic-only`), optional `sizeFitEpcGeneratedAt` (bundle ISO timestamp when ingested), `sizeFitUserMinM2`, optional `sizeFitRawHeadroomRatio`, always `sizeFitIncludedInComposite: 0`.
- **Licence / terms:** [EPC Open Data Communities](https://epc.opendatacommunities.org/) — MHCLG; Open Government Licence; follow site registration and attribution when running the ingest (API key + email).
- **Honesty:** The register is **incomplete** (many dwellings never receive an EPC; coverage varies by borough and type). Treat as **discovery ordering only**.
- **Product copy:** `src/pages/AreaSearchPage/sizeFitUserContext.ts`.

### Schools (phase 1 proxy)

- **Seed proximity + performance blend:** `shared/schools/londonSchoolSeeds.ts` — reference coordinates with optional `performanceByPhase`; expanded sample + DfE CSV merge supply real URNs when ingested. Metadata reflects whether a generated `londonSchoolPerformanceByUrn.ts` is populated.
- **Alternatives:** DfE open data, GIAS; commercial school-location products.

### National Rail — OJP / RTJP

- **URL:** [Online Journey Planner data feeds](https://www.nationalrail.co.uk/developers/online-journey-planner-data-feeds/)
- **Use:** National rail journey planning (SOAP, formal licence, batch onboarding).
- **MVP:** Likely **deferred** in favour of simpler commute proxies.
- **Alternatives:** TfL + straight-line for London-first; commercial journey APIs for national multi-modal.

## Maps (display)

- **Implemented (phase 2 slice):** **MapLibre GL** with default **Carto Positron** vector style (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`) in `src/pages/AreaSearchPage/ResultsMap.tsx` — workplace (red) and ranked area centroids (blue). Override with **`VITE_MAPLIBRE_STYLE_URL`** in `.env.local` (public MapLibre-compatible style JSON; follow that provider’s attribution). Default basemap attribution: **© OpenStreetMap contributors © CARTO** (also surfaced in UI copy).
- **Future:** richer map popups, optional commercial tiles (Mapbox, MapTiler, etc.) where licence allows.
