/**
 * Map estimated journey time to 0–100 vs user's max minutes (same curve as straight-line proxy).
 */
export const commuteScoreFromDurationEstimate = (
  estimatedMinutes: number,
  maxMinutes: number,
): number => {
  if (maxMinutes <= 0) {
    return 0;
  }
  const r = estimatedMinutes / maxMinutes;
  if (r <= 0.75) {
    return 100;
  }
  if (r >= 1.5) {
    return 0;
  }
  return Math.round(100 - ((r - 0.75) / 0.75) * 100);
};
