# Data quality and ranking improvements

Internal roadmap for making **datasets** and **headline rankings** more trustworthy and interpretable.

## Implemented (visible cohort)

1. **No mixed commute reliability** — When TfL/ORS is configured, estimate-only rows are dropped if any candidate has a routed journey (`filterRankedAreasToNetworkRoutedWhenMixed`). See `docs/scoring-behaviour.md`.

2. **Cohort scores for the list you see** — After filtering, **crime**, **price momentum**, **floor-area fit**, and **commute** are recomputed **among visible candidates only**, then the headline composite is rebuilt (`applyVisibleCohortScoreRecalculation`). Commute uses **min–max spread** across the visible set so similar journey times do not all sit at identical subscores.

3. **Results data-quality strip** — The UI shows key **provenance** (crime window, UK HPI reference month, schools performance year, affordability price source) when results load.

## Future (not implemented here)

| Direction                         | Notes                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Listings-linked affordability     | Tie budget to real stock when commercial listing APIs exist; flag thin markets.                                                         |
| Commute time-of-day / reliability | Extra dimensions beyond a single median journey (already partially via disruption/volatility).                                          |
| Schools                           | Catchment or admission proximity needs richer data; surface **coverage %** prominently.                                                 |
| Golden searches                   | Regression fixtures for fixed scenarios (e.g. City workplace + tight transit) to catch drift.                                           |
| Staleness badges                  | Surfacing EPC bundle date, UK HPI month, and school performance year in one place (partially covered by the strip + per-card metadata). |

## Related code

| Concern              | Location                                                        |
| -------------------- | --------------------------------------------------------------- |
| Visible cohort maths | `shared/rankAreas/applyVisibleCohortScoreRecalculation.ts`      |
| Commute spread       | `shared/commute/normalizeCommuteScoresAmongCandidates.ts`       |
| Commute / proxy mix  | `shared/rankAreas/filterRankedAreasToNetworkRoutedWhenMixed.ts` |
| Rank pipeline        | `shared/rankAreas/buildRankedAreas.ts`                          |
