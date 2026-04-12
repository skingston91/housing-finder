/**
 * Spread **0–100 commute subscores** across the **visible** candidate set (min–max), so the top
 * band is not saturated at identical values when journey times are similar. When all values tie,
 * uses neutral **50** (same idea as crime cohort ties).
 */
export const normalizeCommuteScoresAmongCandidates = (scores: readonly number[]): number[] => {
  if (scores.length === 0) {
    return [];
  }
  if (scores.length === 1) {
    const only = scores[0];
    return typeof only === 'number' && Number.isFinite(only) ? [only] : [50];
  }

  const finite = scores.filter((s): s is number => typeof s === 'number' && Number.isFinite(s));
  if (finite.length === 0) {
    return scores.map(() => 50);
  }

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (max === min) {
    return scores.map((s) => (typeof s === 'number' && Number.isFinite(s) ? 50 : 50));
  }

  return scores.map((s) => {
    if (typeof s !== 'number' || !Number.isFinite(s)) {
      return 50;
    }
    const scaled = Math.round(((s - min) / (max - min)) * 100);
    return Math.max(0, Math.min(100, scaled));
  });
};
