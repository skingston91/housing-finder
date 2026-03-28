export interface FourDimensionScores {
  readonly affordability: number;
  readonly commute: number;
  readonly schools: number;
  readonly crime: number;
}

export interface ScoreWeights {
  readonly affordability: number;
  readonly commute: number;
  readonly schools: number;
  readonly crime: number;
}

const defaultWeights: ScoreWeights = {
  affordability: 0.3,
  commute: 0.3,
  schools: 0.2,
  crime: 0.2,
};

/** Weighted sum of 0–100 subscores. Pure; shared by Lambda and web app domain. */
export const compositeScore = (
  breakdown: FourDimensionScores,
  weights: ScoreWeights = defaultWeights,
): number => {
  const wSum = weights.affordability + weights.commute + weights.schools + weights.crime;
  if (wSum <= 0) {
    return 0;
  }
  const raw =
    breakdown.affordability * weights.affordability +
    breakdown.commute * weights.commute +
    breakdown.schools * weights.schools +
    breakdown.crime * weights.crime;
  return Math.round(raw / wSum);
};
