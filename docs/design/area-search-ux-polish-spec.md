# Design spec: Area Search — layout, hierarchy, and UX polish

**Status:** Implemented (iterate with product).  
**Depends on:** [visual-design-spec.md](./visual-design-spec.md), [accessibility-design-spec.md](./accessibility-design-spec.md), [area-search-design-spec.md](./area-search-design-spec.md), [area-search-trust-methodology-compare-spec.md](./area-search-trust-methodology-compare-spec.md), [product-decisions.md](../product-decisions.md), [data-sources.md](../data-sources.md).

## Goals

- Preserve **one primary story per viewport band**: hero + criteria, then **ranked areas as the main outcome** — not competing hero treatments in the results column.
- **Reduce competing focal points**: methodology, commute honesty, map, compare, and alerts follow a clear **reading order** that matches importance (**outcome first**, context second).
- Keep **Jitty-like** calm shell: whitespace, soft neutrals, **one blue primary** for search; secondary actions (copy link, reset, compare) visually subordinate.
- **Data honesty** without apology loops: short factual lines, collapsible depth; align attribution with `docs/data-sources.md` and `searchResultsAttribution` / `MethodologyPanel`.

## Non-goals (this iteration)

- Changing domain models or API contracts (unless a UI-only type is needed).
- New map providers or replacing Carto/OSM tiles.
- Listing search; voice remains **area discovery**.

## Components / structure

| Concern                                     | Direction                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Band A — Hero**                           | Single `h1`, supporting paragraph, one secondary row: copy link + reset. URL/deep-link and copy feedback stay **inline**, muted and small — not a second hero.                                                                                                                                 |
| **Band B — Grid**                           | `SimpleGrid` `lg` two-column: **criteria left**, **results right**; stack on `base`.                                                                                                                                                                                                           |
| **Results column** (`#area-search-results`) | **(1)** `h2` Results + conditional summary when there are hits; **(2)** **ranked card list** (primary scan); **(3)** **map** (supplementary); **(4)** **compare** when ≥2 picks; **(5)** **trust stack** — `CommuteAboutDataPanel`, straight-line `Alert` when applicable, `MethodologyPanel`. |
| **Results column**                          | `AreaSearchResultsColumn.tsx` — explicit section order (list → map → compare → trust); page shell stays in `AreaSearchPage.tsx`.                                                                                                                                                               |

**Criteria** (`AreaSearchCriteriaForm.tsx`) — Remains the only primary submit (`Search areas`). Geocode errors stay inline near workplace controls.

**Result row** (`AreaResultCard.tsx`) — Badge = composite summary; `ScoreBar` = breakdown; compare = secondary `outline` / `sm`.

**Map** (`ResultsMap.tsx`) — Supplementary; list remains fully usable; selection syncs both ways.

**Compare** (`AreaComparePanel.tsx`) — After cards/map when ≥2 selections; table semantics preserved.

## Data and state (brief)

| State               | Source                           | UI behaviour                                                                                                  |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Form**            | React `form`                     | Synced to URL **`q`** (base64url JSON) via `areaSearchUrlState.ts`; debounced `searchParams` update (~450ms). |
| **Results**         | `areas`                          | Not in URL; re-run search after load from shared link.                                                        |
| **Loading / error** | `loading`, `error`               | Busy region + spinner; errors in `Alert` error.                                                               |
| **Geocode**         | `geocodePending`, `geocodeError` | Inline on form.                                                                                               |
| **Selection**       | `selectedAreaId`                 | List ↔ map; live region (`selectionAnnouncement.ts`).                                                         |
| **Compare**         | `compareIds`                     | 0–3; pruned when `areas` change.                                                                              |
| **URL message**     | `urlMessage`                     | Invalid/oversized `q` — short notice using **`fg.warning`** semantic colour.                                  |
| **Copy feedback**   | `copyLinkMessage`                | **`fg.success`**; `role="status"`.                                                                            |
| **Has searched**    | `hasSearched`                    | Empty vs “no areas in this run” vs pre-search onboarding.                                                     |

## User flows

### Primary happy path

1. Land → read hero → adjust criteria.
2. **Search areas** → loading → focus moves to **results** region (`#area-search-results`).
3. Summary line (count, order, top match) when applicable.
4. Scan **cards**; use **map** optionally; compare when ready; **copy link** for criteria-only URL.

### Edge cases

| Case                      | UX                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Never searched**        | Short instruction + primary CTA name in copy; local dev in `<details>`. **Commute about** accordion at **bottom** of results column (no methodology yet). |
| **Loading**               | Spinner + “Ranking areas…”; `aria-busy` on busy region. **Cards** may show **previous** results while a new search runs (stale list until response).      |
| **Search error**          | `Alert` error; no stack traces; suggest fix.                                                                                                              |
| **Geocode error**         | Inline near workplace.                                                                                                                                    |
| **Zero results**          | Info `Alert` + next steps (commute, budget, coordinates). **Commute about** at bottom.                                                                    |
| **Straight-line commute** | Warning `Alert` when `resultsUseStraightLineCommute`; **not** repeated on every card.                                                                     |
| **Low schools coverage**  | Warning in `MethodologyPanel` when thresholds apply.                                                                                                      |

## Visual & UX consistency

- **Typography:** `h1` `3xl` semibold; section `h2` `md`; body `fg`; helpers `fg.muted`; inline URL/copy feedback `sm`/`xs` via **`fg.warning`** / **`fg.success`** (Chakra semantic tokens — extend `src/theme/theme.ts` only if new semantics are needed; prefer existing tokens).
- **Spacing:** `Stack gap={10}` between major page bands; results column `gap={4}` within the column.
- **Surfaces:** Page `gray.50`; panels white, `border` `gray.200`, `rounded="xl"`, `shadow="sm"`.
- **Primary / secondary:** `Search areas` = primary blue; copy / reset / compare = outline / ghost / outline `sm`.
- **Score badge vs bars:** Badge = one anchor; bars = equal breakdown, lighter than badge.

## Progressive disclosure

| Content                  | Location                   | Default                         |
| ------------------------ | -------------------------- | ------------------------------- |
| Composite + breakdown    | Card face                  | Visible                         |
| Numeric metadata, models | Card `details`             | Collapsed                       |
| Shared attribution       | `MethodologyPanel`         | Summary + collapsible full list |
| Commute methodology      | `CommuteAboutDataPanel`    | `<details>`                     |
| Straight-line / fallback | `Alert` when applicable    | Visible when true               |
| Local dev API            | `<details>` in empty state | Collapsed                       |

**Rule:** Facts in `MethodologyPanel` are not repeated verbatim on every card unless row-specific.

## Accessibility

- **Focus after search:** Programmatic focus on `#area-search-results` after success.
- **Tab order:** **Ranked list** precedes **map** in the DOM so keyboard order matches “outcome first” (no skip link required for the default layout).
- **Loading:** `aria-busy` on the busy region, not the whole page.
- **Copy / URL messages:** `role="status"` where appropriate.
- **Compare:** `th scope="col"`; at limit, disabled control with `aria-label`.
- **Non-colour ranking:** Selection ring, rank order in summary copy, bar length + labels.

## Microcopy voice

Calm, factual, discovery-oriented; state what is measured and what may be stubbed in the **right** place; avoid apology loops; align with `docs/data-sources.md`.

## Acceptance criteria

- [x] One primary action in hero (`Search areas` lives in criteria column); results column does not show two competing blue primaries.
- [x] Summary line when `hasSearched && areas.length > 0` (when not loading) includes count, order, top match.
- [x] First visit: onboarding + dev details; ranked list only after data exists.
- [x] Loading: spinner + label; busy region has `aria-busy` during search.
- [x] **Ranked cards** appear **before** the map in DOM order when results exist.
- [x] Map and compare render only when `!loading && areas.length > 0` (cards may show stale data while `loading`).
- [x] Trust stack (`CommuteAbout` → straight-line alert → `MethodologyPanel`) after map/compare when `!loading && areas.length > 0`.
- [x] With no areas (`!hasSearched` or zero-result run): `CommuteAboutDataPanel` at bottom of results column; methodology only when `areas.length > 0`.
- [x] URL / copy feedback use semantic **`fg.warning`** / **`fg.success`** (not ad-hoc hex in components).
- [x] Errors: titled `Alert`; no raw stack traces in UI.

## Open decisions (product)

- **Sticky** summary or trust strip: not required for v1; revisit if the column becomes very tall.
- **Dark mode:** semantic tokens should respect `_light` / `_dark` when a dark theme ships.

## Related implementation files

- `src/pages/AreaSearchPage/AreaSearchPage.tsx`
- `src/pages/AreaSearchPage/AreaSearchResultsColumn.tsx`
- `AreaSearchCriteriaForm.tsx`, `AreaResultCard.tsx`, `ScoreBar.tsx`, `ResultsMap.tsx`, `AreaComparePanel.tsx`, `MethodologyPanel.tsx`, `CommuteAboutDataPanel.tsx`
- `src/theme/theme.ts`
