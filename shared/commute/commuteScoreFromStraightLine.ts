import type { CommuteModeDto } from '../searchAreasContract';

import { haversineKm } from '../rankAreas/geo';

import { commuteScoreFromDurationEstimate } from './commuteScoreFromDurationEstimate';

const ASSUMED_SPEED_KMH: Readonly<Record<CommuteModeDto, number>> = {
  driving: 22,
  transit: 16,
  cycling: 14,
  walking: 5,
};

const estimatedMinutes = (distanceKm: number, mode: CommuteModeDto): number => {
  const v = ASSUMED_SPEED_KMH[mode];
  if (v <= 0) {
    return 999;
  }
  return (distanceKm / v) * 60;
};

/**
 * Straight-line distance → crude travel-time proxy (no routing API). Higher = better fit vs max minutes.
 */
export const commuteScoreFromStraightLine = (
  workplaceLat: number,
  workplaceLng: number,
  candidateLat: number,
  candidateLng: number,
  mode: CommuteModeDto,
  maxMinutes: number,
): number => {
  const km = haversineKm(workplaceLat, workplaceLng, candidateLat, candidateLng);
  const est = estimatedMinutes(km, mode);
  return commuteScoreFromDurationEstimate(est, maxMinutes);
};
