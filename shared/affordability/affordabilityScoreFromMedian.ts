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

/**
 * 0–100: optional **max £/m²** cap vs an indicative London-wide band (not property-specific floor area).
 */
export const affordabilityScoreFromPerM2Cap = (maxPricePerM2Gbp: number): number => {
  if (maxPricePerM2Gbp <= 0) {
    return 50;
  }
  if (maxPricePerM2Gbp >= 9000) {
    return 100;
  }
  if (maxPricePerM2Gbp <= 2500) {
    return 20;
  }
  return Math.round(20 + ((maxPricePerM2Gbp - 2500) / (9000 - 2500)) * 80);
};

/**
 * Combines total budget vs borough median with optional £/m² ceiling (equal weight when £/m² is set).
 */
export const affordabilityScoreForAreaSearch = (
  maxPriceGbp: number,
  medianPriceGbp: number,
  maxPricePerM2Gbp?: number,
): number => {
  const base = affordabilityScoreFromMedian(maxPriceGbp, medianPriceGbp);
  if (maxPricePerM2Gbp === undefined || !Number.isFinite(maxPricePerM2Gbp)) {
    return base;
  }
  const perM2 = affordabilityScoreFromPerM2Cap(maxPricePerM2Gbp);
  return Math.round((base + perM2) / 2);
};
