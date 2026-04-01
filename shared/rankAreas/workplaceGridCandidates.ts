import type { SearchAreasRequestBody } from '../searchAreasContract';

import { LONDON_AREA_CANDIDATES } from './candidates';
import { haversineKm } from './geo';
import { pointInLondonBounds } from './londonBounds';
import { relativePositionHeading } from './relativePositionHeading';

export interface SearchCandidate {
  readonly id: string;
  readonly displayName: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** ~3.8 km per grid step at London latitudes (visual “commute shed” seed, not isochrones). */
const STEP_LAT_DEG = 0.034;
const GRID_RADIUS = 2;

/** Cap parallel police.uk fan-out per request. */
export const MAX_SEARCH_CANDIDATES = 12;

const buildWorkplaceGrid = (body: SearchAreasRequestBody): SearchCandidate[] => {
  const { workplace } = body;
  const cosLat = Math.cos((workplace.latitude * Math.PI) / 180);
  const stepLng = cosLat > 0.2 ? STEP_LAT_DEG / cosLat : STEP_LAT_DEG;
  const out: SearchCandidate[] = [];

  for (let di = -GRID_RADIUS; di <= GRID_RADIUS; di++) {
    for (let dj = -GRID_RADIUS; dj <= GRID_RADIUS; dj++) {
      const latitude = workplace.latitude + di * STEP_LAT_DEG;
      const longitude = workplace.longitude + dj * stepLng;
      if (!pointInLondonBounds(latitude, longitude)) {
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

  return out.slice(0, MAX_SEARCH_CANDIDATES);
};

export type CandidateMode = 'workplace-grid' | 'fixed-london';

/**
 * Candidate centroids for ranking: grid around workplace inside London bounds, else fixed named areas.
 */
export const resolveSearchCandidates = (
  body: SearchAreasRequestBody,
): { readonly mode: CandidateMode; readonly candidates: readonly SearchCandidate[] } => {
  if (!pointInLondonBounds(body.workplace.latitude, body.workplace.longitude)) {
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
