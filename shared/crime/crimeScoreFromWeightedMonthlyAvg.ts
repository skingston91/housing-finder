/**
 * Map average weighted incident count per month → 0–100 (higher = better).
 * Tunable; document changes in docs/architecture.md when adjusting.
 */
export const crimeScoreFromWeightedMonthlyAvg = (avgWeightedPerMonth: number): number => {
  if (!Number.isFinite(avgWeightedPerMonth) || avgWeightedPerMonth < 0) {
    return 50;
  }
  const raw = 100 - avgWeightedPerMonth * 1.5;
  return Math.round(Math.max(0, Math.min(100, raw)));
};
