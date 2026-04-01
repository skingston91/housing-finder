# Product decisions (record)

Decisions below drive the first implementation pass. Change this file when requirements shift.

## Geography and audience

- **England / London first** — Other UK regions later; data models should not hard-code London only, but adapters may start with London bounding boxes or subsets.
- **Anonymous** — No accounts for now; single-user / personal use.

## MVP focus

- **Phase 1: locations (areas), not live listings** — Rank or shortlist **areas** (wards, LSOAs, postcode sectors, etc.; exact unit TBD with data). Commercial listing APIs are **out of scope** until access exists.
- **Buy first; rent later** — Criteria types can later extend to rent; keep naming neutral where cheap (`maxPriceGbp` may become “purchase budget” vs “monthly rent” in a later phase).

## Criteria (user inputs)

- **Affordability:** max total price, max price per m², **property type** (flat, terraced, semi, detached, bungalow, …).
- **Commute:** **fixed workplace** now (single anchor); architecture must allow **multiple anchors** later without breaking the domain model.
- **Schools:** primary / secondary / sixth form, distance or time to schools, faith filters, performance metrics — **all targeted**; MVP may stub some signals until DfE/open data ingestion exists.
- **Crime:** **category-weighted** scores, default **12-month** window; weights and window should be **user-customisable** in product terms (UI may ship incrementally).

## Deferred product items (record)

- **Shareable search URLs / query-param state** — Not implemented yet. Criteria and results stay in local React state only. When we add this, sync with `buildSearchAreasRequest` validation and document CORS/API implications. Design note: [area-search-design-spec.md](./design/area-search-design-spec.md) (URL state line). Trust/compare UI spec: [area-search-trust-methodology-compare-spec.md](./design/area-search-trust-methodology-compare-spec.md).

## Technical

- **React** with **Vite** (not webpack).
- **AWS serverless-first** — Business-sensitive calls and aggregation in **Lambda** (`lambda/`, SAM — [infrastructure/aws-sam.md](./infrastructure/aws-sam.md)); see [development.md](./development.md).
- **Maps / routing:** optimise for **quality vs cost** (document chosen stack in [data-sources.md](./data-sources.md) when implemented); no requirement to use Google for maps if a cheaper stack suffices.
- **Attribution:** apply **source attribution** wherever licences require it; centralise copy in [data-sources.md](./data-sources.md).

## First vertical slice (agreed direction)

- Postcode or area seed + **max price** + **commute (e.g. driving)** + **property type** → ranked area list (other signals added incrementally).
