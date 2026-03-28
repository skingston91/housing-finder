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

### HM Land Registry — Use land and property data API

- **URL:** [API documentation](https://use-land-property-data.service.gov.uk/api-documentation)
- **Use:** Bulk datasets (e.g. corporate ownership) — may be secondary to MVP; account + dataset licence required.
- **Note:** Download URLs are short-lived; batch jobs belong in serverless/cron, not the browser.

### Police.uk — Street-level crime

- **URL:** [Street-level crimes](https://data.police.uk/docs/method/crime-street/)
- **Use:** Approximate crime counts by category near a point or polygon; **not exact locations**.
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

- **Google Maps Platform** ([Directions](https://developers.google.com/maps/documentation/directions/), [@googlemaps/google-maps-services-js](https://github.com/googlemaps/google-maps-services-js)): server-side only; billing and key restriction policy TBD.
- **Alternatives:** Open routing / OSM-based services may reduce cost; document choice when implemented.

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
