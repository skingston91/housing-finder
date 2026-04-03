# Plan: Rightmove search deep links (no implementation yet)

**Status:** planning only — do not treat URL patterns below as final until verified on [rightmove.co.uk](https://www.rightmove.co.uk).

## Goal

Let users **open Rightmove** with **pre-filled search filters** that roughly match their housing-finder criteria (e.g. max price, property types), without ingesting listings or calling Rightmove APIs.

## Non-goals (v1 of this bridge)

- Scraping or automating Rightmove in the background.
- Showing Rightmove listings inside housing-finder.
- Guaranteeing parity with our area ranking (Rightmove’s geography and filters differ from our model).

## User experience (intended)

1. User completes area search in housing-finder and reviews ranked areas.
2. On a **result card** or a **single primary action** after search: **“Open Rightmove with similar filters”** (wording TBD — must be clear the user leaves our site).
3. Optional: secondary control **per area** — “Search this area on Rightmove” — if we can derive a stable location seed for that area.

## How we discover URL shape (before any code)

1. Manually run searches on Rightmove (**for sale** flow aligned with our MVP).
2. Capture full URLs for a small matrix: location only; + max price; + property type; + beds (if we add beds later).
3. Record **query parameter names** and **enumerated values** (e.g. property type codes) in this doc or a short appendix table.
4. Note **date verified** — Rightmove can change URLs without notice.

## Mapping from housing-finder → Rightmove (draft)

| Our input (concept)        | Rightmove (expected to verify manually)      | Risk / gap |
|----------------------------|----------------------------------------------|------------|
| Max purchase price         | Max price param (if present)                 | Usually mappable |
| Property types             | Type filter codes in URL                     | Enum mapping required |
| Location / area            | Place name, outcode, or “radius from point”  | **Hardest** — our areas may not match RM geography |
| Commute / schools / crime  | Not portable                                 | Do not imply equivalence in copy |

**Location strategy options (pick one for MVP):**

- **A.** User-entered **postcode or outcode** (already or newly collected) — simplest URL alignment.
- **B.** **Area centroid** → reverse geocode to outcode or RM-suggested place — more magic, more failure modes.
- **C.** Named label only (e.g. borough) — quick but imprecise.

## Trust, legal, and product copy

- Treat links as **convenience outbound navigation**, not partnership or endorsement, unless formalised later.
- UI copy should state that results are **on Rightmove**, filters are **approximate**, and **listings are not shown in this app**.
- Optional: append **UTM query params** for our own analytics — test whether Rightmove strips them; avoid looking like tracking abuse.

## Technical shape (when implemented later)

- **Pure builder module** (e.g. `buildRightmoveForSaleSearchUrl(input)`) — testable, no I/O.
- **Input type:** minimal DTO (price, property types, location seed) derived from `AreaSearchCriteria` / selected area — not the entire internal model.
- **Feature flag** to disable the button if URLs break in production.
- **Tests:** golden URL strings or parsed query objects; refresh when re-verified.

## Risks

| Risk | Mitigation |
|------|------------|
| URL / param breakage | Feature flag; doc “last verified” date; quick manual check before releases |
| Misleading location overlap | Honest copy; prefer postcode or explicit place over guessing |
| ToS / brand | Links only; no scraping; review Rightmove terms if traffic grows |

## Acceptance criteria (for a future implementation ticket)

- [ ] Documented, **manually verified** sample URLs for at least three scenarios (location only; + price; + type).
- [ ] Clear UI entry point(s) and accessible labels (e.g. “opens Rightmove in a new tab”).
- [ ] Unit tests for the URL builder against frozen examples.
- [ ] Product copy reviewed for “approximate filters” and third-party clarity.

## References

- Broader listings strategy: [roadmap-specific-places.md](./roadmap-specific-places.md)
- Product scope: [product-decisions.md](../product-decisions.md)
