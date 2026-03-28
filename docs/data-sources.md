# Data sources, licensing, and attribution

Keep this file updated whenever we add or change an integration. **Do not ship without meeting each provider’s terms.**

## Principles

- Prefer **official open data** and documented APIs.
- Centralise **attribution** strings the UI or “About data” panel can render.
- Serverless functions hold **secrets** (API keys); never expose in `VITE_*` unless the provider explicitly allows public keys with domain restrictions.

## Sources under consideration

### HM Land Registry (linked data / SPARQL)

- **URL:** [landregistry.data.gov.uk](https://landregistry.data.gov.uk/)
- **Use:** Sold prices, transaction history, area-level aggregates (not current listings).
- **Licence:** Open Government Licence — [OGL](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
- **Attribution (example):** Contains public sector information licensed under the Open Government Licence v3.0.
- **Implementation (phase 1):** `shared/affordability/londonBoroughMedians.ts` supplies **indicative** borough medians for discovery scoring (nearest borough centroid). Optional **max £/m²** is blended with the total-budget score in `affordabilityScoreForAreaSearch` (not a per-property floor-area model). Replace with live SPARQL or official statistical tables when we harden the model; UI/metadata repeats an OGL-style line.

### HM Land Registry — Use land and property data API

- **URL:** [API documentation](https://use-land-property-data.service.gov.uk/api-documentation)
- **Use:** Bulk datasets (e.g. corporate ownership) — may be secondary to MVP; account + dataset licence required.
- **Note:** Download URLs are short-lived; batch jobs belong in serverless/cron, not the browser.

### Police.uk — Street-level crime

- **URL:** [Street-level crimes](https://data.police.uk/docs/method/crime-street/)
- **Use:** Approximate crime counts by category near a point or polygon; **not exact locations**.
- **Implementation:** `shared/policeUk/streetCrimes.ts` and `shared/rankAreas/buildRankedAreas.ts` (called from `lambda/search-areas.ts`). Each ranked area uses a fixed candidate centroid; responses include `metadata.dataPoliceUk` for UI attribution.
- **Attribution:** Follow [data.police.uk](https://data.police.uk/) terms; surface anonymisation caveats in UI help text.
- **Caveat:** Scotland coverage differs (BTP-only nuance per their docs).

### Department for Education — School performance

- **URL:** [Compare school performance](https://www.compare-school-performance.service.gov.uk/) (human-facing); prefer **official open data** downloads/APIs where available for automation.
- **Use:** Distance to good schools, phase filters, performance bands.
- **Risk:** Scraping the website is fragile; plan ingestion from **published open data** files or APIs only.

### Property listings (Zoopla, Rightmove, etc.)

- **Status:** **Not used** until commercial/developer access is approved.
- **URL (reference):** [Zoopla developers](https://developers.zoopla.co.uk/)

### Routing and geocoding

- **OpenStreetMap Nominatim** ([usage policy](https://operations.osmfoundation.org/policies/nominatim/)): forward geocoding from the workplace label via **`POST /api/geocode-workplace`** (`lambda/geocode-workplace.ts`, `shared/geocoding/nominatim.ts`). **Low volume only** — identify with `User-Agent`; do not bulk or scrape; consider a dedicated geocoder in production.
- **Google Maps Platform** ([Directions](https://developers.google.com/maps/documentation/directions/), [@googlemaps/google-maps-services-js](https://github.com/googlemaps/google-maps-services-js)): server-side only; billing and key restriction policy TBD.
- **Alternatives:** Open routing / OSM-based services may reduce cost; document choice when implemented.

### Commute (phase 1 proxy)

- **Straight-line heuristic:** `shared/commute/commuteScoreFromStraightLine.ts` — distance × assumed mode speed (not a routing engine). Documented in result metadata as `commuteModel: straight-line-time-estimate`.

### Schools (phase 1 proxy)

- **Seed proximity:** `shared/schools/londonSchoolSeeds.ts` — small reference coordinate set; `metadata.schoolsModel: seed-school-distance`. Not DfE performance data; replace with official open data when available.

### TfL

- **Reference:** [example API requests (PDF)](https://content.tfl.gov.uk/example-api-requests.pdf)
- **Use:** Tube / bus–oriented journey proxies for London; usually requires an **app key** (serverless env).

### National Rail — OJP / RTJP

- **URL:** [Online Journey Planner data feeds](https://www.nationalrail.co.uk/developers/online-journey-planner-data-feeds/)
- **Use:** National rail journey planning (SOAP, formal licence, batch onboarding).
- **MVP:** Likely **deferred** in favour of simpler commute proxies.

## Maps (display)

- Choice TBD for **cost vs quality** (e.g. MapLibre + raster/vector tiles with required attribution vs Google Maps JS).
- When we pick a stack, record **tile provider attribution** here and render it in the map UI.
