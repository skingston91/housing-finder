# Design spec: Trust, methodology, schools explain, compare (phase 2)

**Status:** Implemented.  
**Depends on:** [area-search-design-spec.md](./area-search-design-spec.md), [visual-design-spec.md](./visual-design-spec.md), [accessibility-design-spec.md](./accessibility-design-spec.md).

## Goals

- Surface **data honesty** without crowding the primary results story: one short **summary** line, full attribution and methodology in a **collapsible** block.
- Warn when **schools performance join coverage** is low (URN map vs establishment points) so users do not over-trust the schools bar.
- Give a **single plain-language line** for how the **schools** dimension was computed (metadata-driven; no new API fields required).
- Let users **compare 2–3 areas** on dimension scores side-by-side after a search.

**Non-goals (this iteration):** shareable URLs / query-param state — see [product-decisions.md](../product-decisions.md).

## Structure

| Piece                     | Location                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Methodology + attribution | `src/pages/AreaSearchPage/AreaSearchPage.tsx` (`MethodologyPanel`)                                       |
| Schools one-liner         | `shared/schools/schoolsDimensionExplanation.ts` + `AreaResultCard` under Schools bar                     |
| Compare                   | `src/pages/AreaSearchPage/AreaComparePanel.tsx` (or inline in page) + compare toggle on `AreaResultCard` |

## User flow

1. After a successful search, user sees **Results** heading, then a **one-line methodology summary**, optional **low schools coverage** warning, then **collapsible** “Data sources and methodology” with full lines (police, Land Registry, schools, year, coverage).
2. Each result card shows dimension bars; under **Schools**, a **muted one-line** explanation from metadata.
3. User can add up to **three** areas to **Compare** via a secondary control on the card (does not change map selection). When **≥ 2** areas are selected, a **comparison strip** shows a compact table of scores.

## Visual / UX

- **Hierarchy:** Summary line uses `fg.muted` `sm`; collapsible uses same pattern as existing card “Score details” (`details`/`summary`).
- **Warning:** Use `Alert` warning variant only when DfE URN performance model is active, `schoolsPointsWithUrn > 0`, and `schoolsPerformanceCoveragePct` **&lt; 50** (threshold constant in UI).
- **Compare:** Secondary `Button` size `sm` variant `outline`; do not compete with card selection ring. **Keyboard:** button is tab-focusable; **Space/Enter** toggles compare without activating card click (stop propagation).

## Accessibility

- Collapsible block is native `<details>` with visible `<summary>` for SR compatibility.
- Compare table uses `<table>` with `<th scope="col">` for column headers.
- If compare limit reached, disabled button has `title` / `aria-label` explaining “Maximum 3 areas”.

## Acceptance criteria

- [x] When results load, user sees a methodology **summary** without scrolling past the map (unless viewport is tiny).
- [x] Expanding methodology shows at least the same attribution content as the previous flat alert block.
- [x] When `schoolsModel` is `gias-open-data-sample-dfe-performance-urn-map`, `schoolsPointsWithUrn > 0`, and `schoolsPerformanceCoveragePct < 50`, a **warning** alert appears above the collapsible.
- [x] Each card shows a **schools explanation** line when metadata supports it; line is absent or minimal when not applicable.
- [x] User can select **0–3** compare slots; with **2+** selected, a comparison table lists those areas with the four dimension scores and composite score.
- [x] Shareable URLs remain **out of scope** (documented in product decisions).
