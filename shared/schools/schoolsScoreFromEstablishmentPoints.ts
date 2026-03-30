import type { SchoolPhaseDto, SchoolsDto } from '../searchAreasContract';

import { haversineKm } from '../rankAreas/geo';

import type { LondonSchoolSeed } from './londonSchoolSeeds';

const WALK_KMH = 5;
const PERFORMANCE_BLEND = 0.35;

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

const clamp0to100 = (n: number): number => Math.max(0, Math.min(100, n));

const performanceScoreForSeed = (
  seed: LondonSchoolSeed,
  userPhases: readonly SchoolPhaseDto[],
): number | null => {
  const p = seed.performanceByPhase;
  if (p === undefined) {
    return null;
  }
  let best: number | null = null;
  for (const phase of userPhases) {
    const v = p[phase];
    if (typeof v === 'number' && Number.isFinite(v)) {
      const c = clamp0to100(v);
      best = best === null ? c : Math.max(best, c);
    }
  }
  return best;
};

const nearestMatchingPoint = (
  schools: SchoolsDto,
  candidateLat: number,
  candidateLng: number,
  points: readonly LondonSchoolSeed[],
): { readonly km: number; readonly point: LondonSchoolSeed } | null => {
  let bestKm: number | null = null;
  let bestPoint: LondonSchoolSeed | null = null;
  for (const s of points) {
    if (!seedMatchesUserPhases(s.phases, schools.phases)) {
      continue;
    }
    const km = haversineKm(candidateLat, candidateLng, s.latitude, s.longitude);
    if (bestKm === null || km < bestKm) {
      bestKm = km;
      bestPoint = s;
    }
  }
  if (bestKm !== null && bestPoint !== null) {
    return { km: bestKm, point: bestPoint };
  }
  return null;
};

const nearestMatchingPointAnyPhase = (
  candidateLat: number,
  candidateLng: number,
  points: readonly LondonSchoolSeed[],
): number | null => {
  let best: number | null = null;
  for (const s of points) {
    const km = haversineKm(candidateLat, candidateLng, s.latitude, s.longitude);
    if (best === null || km < best) {
      best = km;
    }
  }
  return best;
};

const nearestPerformanceMatchingPoint = (
  schools: SchoolsDto,
  candidateLat: number,
  candidateLng: number,
  points: readonly LondonSchoolSeed[],
): { readonly km: number; readonly point: LondonSchoolSeed } | null => {
  let bestKm: number | null = null;
  let bestPoint: LondonSchoolSeed | null = null;
  for (const s of points) {
    if (!seedMatchesUserPhases(s.phases, schools.phases)) {
      continue;
    }
    if (performanceScoreForSeed(s, schools.phases) === null) {
      continue;
    }
    const km = haversineKm(candidateLat, candidateLng, s.latitude, s.longitude);
    if (bestKm === null || km < bestKm) {
      bestKm = km;
      bestPoint = s;
    }
  }
  if (bestKm !== null && bestPoint !== null) {
    return { km: bestKm, point: bestPoint };
  }
  return null;
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
 * Distance to nearest establishment point matching selected phases (fallback: any point). Optional walk-time cap.
 */
export const schoolsScoreFromEstablishmentPoints = (
  schools: SchoolsDto,
  candidateLat: number,
  candidateLng: number,
  points: readonly LondonSchoolSeed[],
): number => {
  const nearestMatch = nearestMatchingPoint(schools, candidateLat, candidateLng, points);
  if (nearestMatch === null) {
    const anyKm = nearestMatchingPointAnyPhase(candidateLat, candidateLng, points);
    if (anyKm === null) {
      return 40;
    }
    let score = scoreFromNearestKm(anyKm);
    const maxMin = schools.maxWalkOrDriveMinutes;
    if (typeof maxMin === 'number' && maxMin > 0) {
      const maxKm = (maxMin / 60) * WALK_KMH;
      if (anyKm > maxKm) {
        score = Math.max(0, Math.round(score * (maxKm / anyKm)));
      }
    }
    return Math.min(100, score);
  }

  const km = nearestMatch.km;
  const distanceScore = scoreFromNearestKm(km);
  let combinedScore = distanceScore;

  const nearestPerformancePoint = nearestPerformanceMatchingPoint(
    schools,
    candidateLat,
    candidateLng,
    points,
  );
  if (nearestPerformancePoint !== null) {
    const perfScore = performanceScoreForSeed(nearestPerformancePoint.point, schools.phases);
    if (perfScore !== null) {
      combinedScore = Math.round(
        distanceScore * (1 - PERFORMANCE_BLEND) + perfScore * PERFORMANCE_BLEND,
      );
    }
  }

  const maxMin = schools.maxWalkOrDriveMinutes;
  if (typeof maxMin === 'number' && maxMin > 0) {
    const maxKm = (maxMin / 60) * WALK_KMH;
    if (km > maxKm) {
      combinedScore = Math.max(0, Math.round(combinedScore * (maxKm / km)));
    }
  }

  return Math.min(100, combinedScore);
};
