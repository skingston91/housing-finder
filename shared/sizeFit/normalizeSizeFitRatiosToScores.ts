/**
 * Map **headroom ratios** (typical m² ÷ user min m²) to 0–100 **within this search’s candidates**.
 * Higher ratio → higher score. Nulls (missing data) → neutral 50.
 */
export const normalizeSizeFitRatiosToScores = (ratios: readonly (number | null)[]): number[] => {
  const finite = ratios.filter((v): v is number => v !== null && Number.isFinite(v));
  if (finite.length === 0) {
    return ratios.map(() => 50);
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (max === min) {
    return ratios.map((v) => (v === null || !Number.isFinite(v) ? 50 : 50));
  }
  return ratios.map((v) => {
    if (v === null || !Number.isFinite(v)) {
      return 50;
    }
    return Math.round(((v - min) / (max - min)) * 100);
  });
};
