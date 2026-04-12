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
 * Haversine distance and assumed mode speed → minutes (same inputs as {@link commuteScoreFromStraightLine}).
 * Exposed so APIs can surface “~N min” when no routing engine returns a duration.
 */
export const estimateStraightLineCommuteMinutes = (
  workplaceLat: number,
  workplaceLng: number,
  candidateLat: number,
  candidateLng: number,
  mode: CommuteModeDto,
): number => {
  const km = haversineKm(workplaceLat, workplaceLng, candidateLat, candidateLng);
  return estimatedMinutes(km, mode);
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
  const est = estimateStraightLineCommuteMinutes(
    workplaceLat,
    workplaceLng,
    candidateLat,
    candidateLng,
    mode,
  );
  return commuteScoreFromDurationEstimate(est, maxMinutes);
};
