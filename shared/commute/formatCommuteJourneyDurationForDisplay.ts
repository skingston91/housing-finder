/**
 * Human-readable journey duration for UI. Values under one minute are shown in seconds so
 * “0.4 min” never appears (users read that as a broken commute).
 */
export const formatCommuteJourneyDurationForDisplay = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return '—';
  }
  if (minutes < 1) {
    const sec = Math.max(1, Math.round(minutes * 60));
    return `~${String(sec)} sec`;
  }
  const rounded = Math.round(minutes * 10) / 10;
  return rounded % 1 === 0 ? `~${String(Math.round(rounded))} min` : `~${rounded.toFixed(1)} min`;
};
