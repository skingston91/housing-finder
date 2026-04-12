import type { SearchAreasRequestBody } from '../searchAreasContract';

import { LONDON_AREA_CANDIDATES } from './candidates';
import { commuteEnvelopeRadiusKm } from './commuteEnvelopeRadiusKm';
import { haversineKm } from './geo';
import { pointInSearchRegionBounds } from './londonBounds';
import { relativePositionHeading } from './relativePositionHeading';

export interface SearchCandidate {
  readonly id: string;
  readonly displayName: string;
  readonly latitude: number;
  readonly longitude: number;
}

const KM_PER_DEG_LAT = 111;

/** Baseline grid step (~3.8 km at London latitudes). */
const STEP_LAT_DEG_MIN = 0.034;

/**
 * Upper bound on how many area centroids we score per request (police.uk + TfL + routing cost).
 * Subsample the commute disk when the grid is denser than this.
 */
export const MAX_SEARCH_CANDIDATES = 96;

/**
 * When **transit** uses the TfL Journey Planner (serialized HTTP + optional inter-call spacing), scoring
 * more than this many candidates routinely exceeds typical Lambda timeouts (~300s). Further subsample the
 * stratified grid (same distance-spread rule as {@link pickStratifiedAlongDistance}).
 */
export const MAX_TRANSIT_TFL_ROUTING_CANDIDATES = 48;

/**
 * After sorting by distance from workplace, take `max` points spread from near to far so the
 * outer commute envelope is represented (not only the nearest ring of cells).
 */
const pickStratifiedAlongDistance = <T>(sortedNearestFirst: readonly T[], max: number): T[] => {
  const n = sortedNearestFirst.length;
  if (n <= max) {
    return [...sortedNearestFirst];
  }
  const out: T[] = [];
  for (let i = 0; i < max; i++) {
    const idx = Math.min(n - 1, Math.max(0, Math.floor(((i + 0.5) * n) / max)));
    const item = sortedNearestFirst[idx];
    if (item === undefined) {
      throw new Error('pickStratifiedAlongDistance: index out of range');
    }
    out.push(item);
  }
  return out;
};

/**
 * Reduce candidate count while keeping spread from near workplace to far (same algorithm as the grid builder).
 */
export const capSearchCandidatesStratifiedByWorkplace = (
  workplace: { readonly latitude: number; readonly longitude: number },
  candidates: readonly SearchCandidate[],
  max: number,
): SearchCandidate[] => {
  if (candidates.length <= max) {
    return [...candidates];
  }
  const sorted = [...candidates].sort((a, b) => {
    const da = haversineKm(workplace.latitude, workplace.longitude, a.latitude, a.longitude);
    const db = haversineKm(workplace.latitude, workplace.longitude, b.latitude, b.longitude);
    return da - db;
  });
  return pickStratifiedAlongDistance(sorted, max);
};

const buildWorkplaceGrid = (body: SearchAreasRequestBody): SearchCandidate[] => {
  const { workplace, commute } = body;
  const radiusKm = commuteEnvelopeRadiusKm(commute.maxMinutes, commute.mode);

  const stepKm = Math.min(7.5, Math.max(2.8, radiusKm / 9));
  const stepLatDeg = Math.max(STEP_LAT_DEG_MIN, stepKm / KM_PER_DEG_LAT);

  const cosLat = Math.cos((workplace.latitude * Math.PI) / 180);
  const stepLngDeg = cosLat > 0.2 ? stepLatDeg / cosLat : stepLatDeg;
  const stepKmLat = stepLatDeg * KM_PER_DEG_LAT;
  const maxD = Math.ceil(radiusKm / stepKmLat) + 1;

  const out: SearchCandidate[] = [];
  for (let di = -maxD; di <= maxD; di++) {
    for (let dj = -maxD; dj <= maxD; dj++) {
      const latitude = workplace.latitude + di * stepLatDeg;
      const longitude = workplace.longitude + dj * stepLngDeg;
      if (!pointInSearchRegionBounds(latitude, longitude)) {
        continue;
      }
      const d = haversineKm(workplace.latitude, workplace.longitude, latitude, longitude);
      if (d > radiusKm + 1e-6) {
        continue;
      }
      out.push({
        id: `wg-${String(di)}-${String(dj)}`,
        displayName: relativePositionHeading(
          workplace.latitude,
          workplace.longitude,
          latitude,
          longitude,
        ),
        latitude,
        longitude,
      });
    }
  }

  out.sort((a, b) => {
    const da = haversineKm(workplace.latitude, workplace.longitude, a.latitude, a.longitude);
    const db = haversineKm(workplace.latitude, workplace.longitude, b.latitude, b.longitude);
    return da - db;
  });

  return pickStratifiedAlongDistance(out, MAX_SEARCH_CANDIDATES);
};

export type CandidateMode = 'workplace-grid' | 'fixed-london';

/**
 * Candidate centroids for ranking: grid around workplace inside London bounds, else fixed named areas.
 */
export const resolveSearchCandidates = (
  body: SearchAreasRequestBody,
): { readonly mode: CandidateMode; readonly candidates: readonly SearchCandidate[] } => {
  if (!pointInSearchRegionBounds(body.workplace.latitude, body.workplace.longitude)) {
    return {
      mode: 'fixed-london',
      candidates: LONDON_AREA_CANDIDATES.slice(0, MAX_SEARCH_CANDIDATES),
    };
  }

  const grid = buildWorkplaceGrid(body);
  if (grid.length > 0) {
    return { mode: 'workplace-grid', candidates: grid };
  }

  return {
    mode: 'fixed-london',
    candidates: LONDON_AREA_CANDIDATES.slice(0, MAX_SEARCH_CANDIDATES),
  };
};
