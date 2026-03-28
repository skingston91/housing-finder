/**
 * 0–100: higher = user's max budget stretches further vs an indicative borough median.
 */
export const affordabilityScoreFromMedian = (
  maxPriceGbp: number,
  medianPriceGbp: number,
): number => {
  if (medianPriceGbp <= 0 || maxPriceGbp <= 0) {
    return 50;
  }
  const r = maxPriceGbp / medianPriceGbp;
  if (r >= 1.15) {
    return 100;
  }
  if (r <= 0.35) {
    return 15;
  }
  return Math.round(15 + ((r - 0.35) / (1.15 - 0.35)) * 85);
};
