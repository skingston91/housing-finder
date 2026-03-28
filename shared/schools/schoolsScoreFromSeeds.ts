import type { SchoolPhaseDto, SchoolsDto } from '../searchAreasContract';

import { haversineKm } from '../rankAreas/geo';

import { LONDON_SCHOOL_SEEDS } from './londonSchoolSeeds';

const WALK_KMH = 5;

const seedMatchesUserPhases = (
  seedPhases: readonly SchoolPhaseDto[],
  userPhases: readonly SchoolPhaseDto[],
): boolean => {
  for (const p of userPhases) {
    if (seedPhases.includes(p)) {
      return true;
    }
  }
  return false;
};

const nearestMatchingKm = (
  schools: SchoolsDto,
  candidateLat: number,
  candidateLng: number,
): number | null => {
  let best: number | null = null;
  for (const s of LONDON_SCHOOL_SEEDS) {
    if (!seedMatchesUserPhases(s.phases, schools.phases)) {
      continue;
    }
    const km = haversineKm(candidateLat, candidateLng, s.latitude, s.longitude);
    if (best === null || km < best) {
      best = km;
    }
  }
  if (best !== null) {
    return best;
  }
  for (const s of LONDON_SCHOOL_SEEDS) {
    const km = haversineKm(candidateLat, candidateLng, s.latitude, s.longitude);
    if (best === null || km < best) {
      best = km;
    }
  }
  return best;
};

const scoreFromNearestKm = (km: number): number => {
  if (km <= 0.4) {
    return 100;
  }
  if (km >= 6) {
    return 10;
  }
  return Math.round(100 - ((km - 0.4) / (6 - 0.4)) * 90);
};

/**
 * Distance to nearest seed school matching selected phases (fallback: any seed). Optional walk-time cap.
 */
export const schoolsScoreFromSeeds = (
  schools: SchoolsDto,
  candidateLat: number,
  candidateLng: number,
): number => {
  const km = nearestMatchingKm(schools, candidateLat, candidateLng);
  if (km === null) {
    return 40;
  }
  let score = scoreFromNearestKm(km);
  const maxMin = schools.maxWalkOrDriveMinutes;
  if (typeof maxMin === 'number' && maxMin > 0) {
    const maxKm = (maxMin / 60) * WALK_KMH;
    if (km > maxKm) {
      score = Math.max(0, Math.round(score * (maxKm / km)));
    }
  }
  return Math.min(100, score);
};
