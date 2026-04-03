# Roadmap: from areas to specific places (listings)

Today the app **discovers and ranks areas** (wards / candidates) using affordability, commute, schools, and crime — not individual properties. This doc outlines how to evolve toward **finding specific homes** without breaking the current vertical slice.

## Current state (Phase 1)

- **Output:** Ranked **areas** with scores, map, compare, methodology.
- **Listings:** Explicitly deferred — see [product-decisions.md](../product-decisions.md) (“locations first, not live listings”).

## Direction: Phase 2 — listings and property detail

1. **Commercial listing feed** — Integrate one or more APIs (permissions, pricing, ToS). Map listing → area / geometry for filtering by ranked area.
2. **Bridge UX** — From an area card: “See properties in this area” opens a filtered list (or deep-link to a partner).
3. **Criteria carry-over** — Reuse max price, property types, commute bounds as listing filters where the feed supports them.

## Direction: Phase 3 — richer place finding

- **Saved searches / alerts** (may require accounts).
- **Street or postcode granularity** where data allows.
- **Rent** — extend criteria model ([product-decisions.md](../product-decisions.md) “Buy first; rent later”).

## Technical notes

- **Domain:** Keep `AreaSearchCriteria` and ranked areas separate from a future `Listing` / `Property` model; adapters per feed.
- **Scale:** Listing search is often heavier than area ranking — consider async jobs or capped result sets first.

## Near-term product steps (suggested order)

1. **Low-effort bridge (planned, not built yet):** preset **Rightmove** (or similar) search URLs from user criteria — see [plan-rightmove-deep-links.md](./plan-rightmove-deep-links.md).
2. Confirm **target listing provider(s)** and legal constraints for any in-app or API-backed listings.
3. Spike **read-only listing search** behind a feature flag.
4. Add **entry points** from ranked area results only (no change to core ranking pipeline until stable).

Update [product-decisions.md](../product-decisions.md) when Phase 2 scope is agreed.
