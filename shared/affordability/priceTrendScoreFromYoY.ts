/**
 * Map raw year-on-year % values to 0–100 for ranking **among candidates** in one search.
 * Higher YoY → higher score (relative momentum). Nulls become neutral 50.
 */
export const normalizeYoYPctToScores = (yoyPct: readonly (number | null)[]): number[] => {
  const finite = yoyPct.filter((v): v is number => v !== null && Number.isFinite(v));
  if (finite.length === 0) {
    return yoyPct.map(() => 50);
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (max === min) {
    return yoyPct.map((v) => (v === null || !Number.isFinite(v) ? 50 : 50));
  }
  return yoyPct.map((v) => {
    if (v === null || !Number.isFinite(v)) {
      return 50;
    }
    return Math.round(((v - min) / (max - min)) * 100);
  });
};
