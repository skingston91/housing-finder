/**
 * Map a single headroom ratio (typical m² ÷ user min m²) to 0–100 when the cohort does not spread
 * (one candidate or all equal). Below 1 → “tight”; at/above 1 → “meets or exceeds” up to a cap.
 */
const absoluteHeadroomToSizeFitScore = (ratio: number): number => {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return 50;
  }
  if (ratio < 1) {
    return Math.round(Math.max(0, Math.min(49, 49 * ratio)));
  }
  return Math.round(Math.min(100, 50 + 50 * Math.min(1, ratio - 1)));
};

/**
 * Map **headroom ratios** (typical m² ÷ user min m²) to 0–100 **within this search’s candidates**.
 * When min ≠ max, scores are relative across candidates. When all non-null ratios tie (or one
 * candidate), uses {@link absoluteHeadroomToSizeFitScore} so a strong single listing is not stuck
 * at neutral 50. Nulls (missing data) → neutral 50.
 */
export const normalizeSizeFitRatiosToScores = (ratios: readonly (number | null)[]): number[] => {
  const finite = ratios.filter((v): v is number => v !== null && Number.isFinite(v));
  if (finite.length === 0) {
    return ratios.map(() => 50);
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (max === min) {
    return ratios.map((v) =>
      v === null || !Number.isFinite(v) ? 50 : absoluteHeadroomToSizeFitScore(v),
    );
  }
  return ratios.map((v) => {
    if (v === null || !Number.isFinite(v)) {
      return 50;
    }
    return Math.round(((v - min) / (max - min)) * 100);
  });
};
