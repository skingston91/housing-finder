# Scoring behaviour (internal reference)

Short answers for **Phase 0-style** questions: what is intentional, what was fixed, and where the code lives.

## Crime

- **Pipeline:** For each candidate, police.uk street crime is aggregated into a **weighted monthly average** (`crimeWeightedTotal` / months succeeded). **Cohort normalization** maps those averages to 0–100 **within the search**: lower reported load → **higher** subscore (`shared/crime/crimeScoresNormalizedAmongCandidates.ts`).
- **Subscore `0`:** Usually **worst in this batch** when there is spread (not a missing-data placeholder).
- **All tie or one value:** Non-error rows score **50** before the completeness blend (then **partial months** pull toward 50 via `applyCrimeMonthCompleteness`).
- **Police.uk failure for an area:** **`CRIME_SCORE_WHEN_POLICE_UNAVAILABLE` (28)** — below neutral so missing data does not rank like “average crime” (`shared/crime/crimeScoreWhenPoliceUnavailable.ts`).
- **Historical bug:** A linear map on huge raw averages clamped everything to ~0; **fixed** by cohort normalization.

### Diagnostics (optional)

Set **`HOUSING_FINDER_SCORING_DIAGNOSTICS=1`** on **SearchAreasFunction** (e.g. `sam/env.local.json`). Each search logs one JSON line: `crime_score_search_diagnostics` with **min / max / mean / sample stddev** of final crime subscores and candidate count (`shared/rankAreas/crimeScoreSearchDiagnostics.ts`). Off by default.

## Commute (TfL / ORS)

- **Routed journey:** Higher confidence; **fallback** after TfL or ORS failure uses straight-line time with **proxy and API-failure penalties** (`shared/commute/commuteScoreNetworkRoutingBonus.ts`).
- **Fairness:** Results sort by **`commuteRankTier`** (estimate-only group second), then headline score. **`commuteRoutingConfidence`** and **`commuteModel`** distinguish routed vs fallback.
- **TfL debugging:** Metadata can include **`commuteTflFailureCode`**, **`commuteTflRawJourneyCount`**, **`commuteTflQualifyingJourneyCount`** (see `shared/commute/tflJourney.ts`).

When **many transit** candidates hit **`tfl-fallback-straight-line`**, the results column may show a **warning** (tight filters or API issues).

## Price momentum (UK HPI YoY)

- **Headline composite** uses **four dimensions** (affordability, commute, schools, crime) unless **`includePriceTrendInComposite`** is on **and** YoY **differs** across candidates (`priceTrendHasSpread` in `shared/rankAreas/buildRankedAreas.ts`).
- When momentum is **not** in the headline, **`priceTrendAppliedToComposite`** is **0** on metadata; the UI labels the bar **“not in headline total”** and explains in the line under the bar.

## Floor-area fit

- Second score; **not** in headline total. When all headroom ratios **tie**, scores use an **absolute headroom** curve so a single strong listing is not stuck at neutral (`shared/sizeFit/normalizeSizeFitRatiosToScores.ts`).

## Composite weights

- **Four-dim:** `shared/scoring/compositeScore.ts` — default weights sum to 1.
- **Five-dim (with momentum):** `compositeScoreWithPriceTrend` — default weights sum to 1; used only when momentum is **applied** for that search.

## Related code

| Concern             | Location                                               |
| ------------------- | ------------------------------------------------------ |
| Rank pipeline       | `shared/rankAreas/buildRankedAreas.ts`                 |
| Composite           | `shared/scoring/compositeScore.ts`                     |
| Crime normalization | `shared/crime/crimeScoresNormalizedAmongCandidates.ts` |
