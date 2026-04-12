/**
 * Legacy linear map from a single average weighted incident rate → 0–100.
 * **Ranking** uses {@link crimeScoresNormalizedAmongCandidates} so scores spread within each search.
 * Kept for tests and any direct call sites that need a fixed scale.
 */
export const crimeScoreFromWeightedMonthlyAvg = (avgWeightedPerMonth: number): number => {
  if (!Number.isFinite(avgWeightedPerMonth) || avgWeightedPerMonth < 0) {
    return 50;
  }
  const raw = 100 - avgWeightedPerMonth * 1.5;
  return Math.round(Math.max(0, Math.min(100, raw)));
};
