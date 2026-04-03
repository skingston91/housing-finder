export interface FourDimensionScores {
  readonly affordability: number;
  readonly commute: number;
  readonly schools: number;
  readonly crime: number;
}

/** Fifth dimension: relative UK HPI **year-on-year momentum** among candidates (0–100), not a price forecast. */
export interface FiveDimensionScores extends FourDimensionScores {
  readonly priceTrend: number;
}

export interface ScoreWeights {
  readonly affordability: number;
  readonly commute: number;
  readonly schools: number;
  readonly crime: number;
}

export interface ScoreWeightsWithPriceTrend extends ScoreWeights {
  readonly priceTrend: number;
}

const defaultWeights: ScoreWeights = {
  affordability: 0.3,
  commute: 0.3,
  schools: 0.2,
  crime: 0.2,
};

/** Default blend when price momentum is included (sums to 1). */
export const defaultWeightsWithPriceTrend: ScoreWeightsWithPriceTrend = {
  affordability: 0.24,
  commute: 0.24,
  schools: 0.16,
  crime: 0.16,
  priceTrend: 0.2,
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

/** Composite including **price momentum** (UK HPI YoY among candidates). */
export const compositeScoreWithPriceTrend = (
  breakdown: FiveDimensionScores,
  weights: ScoreWeightsWithPriceTrend = defaultWeightsWithPriceTrend,
): number => {
  const wSum =
    weights.affordability + weights.commute + weights.schools + weights.crime + weights.priceTrend;
  if (wSum <= 0) {
    return 0;
  }
  const raw =
    breakdown.affordability * weights.affordability +
    breakdown.commute * weights.commute +
    breakdown.schools * weights.schools +
    breakdown.crime * weights.crime +
    breakdown.priceTrend * weights.priceTrend;
  return Math.round(raw / wSum);
};
