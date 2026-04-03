import { haversineKm } from '../rankAreas/geo';

import {
  type LondonPlannedTransportPoint,
  LONDON_PLANNED_TRANSPORT_DATA_LAST_REVIEWED,
  LONDON_PLANNED_TRANSPORT_POINTS,
} from './londonPlannedTransportPoints';

/** Beyond this distance (km), proximity score is 0 (spike heuristic). */
export const PLANNED_TRANSPORT_MAX_KM_FOR_SCORE = 8;

export interface PlannedTransportProximityResult {
  readonly model: 'london-planned-point-proximity-v1';
  readonly nearestKm: number;
  readonly schemeLabel: string;
  readonly pointLabel: string;
  readonly sourceUrl: string;
  /** 0–100; higher = closer to nearest **illustrative** planned-transport waypoint. */
  readonly proximityScore0To100: number;
  /** When the waypoint list was last curated (`LONDON_PLANNED_TRANSPORT_DATA_LAST_REVIEWED`). */
  readonly dataLastReviewedIsoDate: string;
}

const scoreFromKm = (km: number): number => {
  if (!Number.isFinite(km) || km < 0) {
    return 0;
  }
  if (km >= PLANNED_TRANSPORT_MAX_KM_FOR_SCORE) {
    return 0;
  }
  return Math.round((1 - km / PLANNED_TRANSPORT_MAX_KM_FOR_SCORE) * 100);
};

const nearestPoint = (
  latitude: number,
  longitude: number,
  points: readonly LondonPlannedTransportPoint[],
): { readonly point: LondonPlannedTransportPoint; readonly km: number } => {
  let best: { readonly point: LondonPlannedTransportPoint; readonly km: number } | null = null;
  for (const point of points) {
    const km = haversineKm(latitude, longitude, point.latitude, point.longitude);
    if (best === null || km < best.km) {
      best = { point, km };
    }
  }
  if (best === null) {
    throw new Error('plannedTransport: no points configured');
  }
  return best;
};

/**
 * **Spike:** distance from candidate centroid to the nearest **curated** Greater London planned-
 * transport waypoint. Does **not** use live TfL Journey Planner or committed opening dates.
 */
export const plannedTransportProximityForPoint = (
  latitude: number,
  longitude: number,
  points: readonly LondonPlannedTransportPoint[] = LONDON_PLANNED_TRANSPORT_POINTS,
): PlannedTransportProximityResult => {
  const { point, km } = nearestPoint(latitude, longitude, points);
  return {
    model: 'london-planned-point-proximity-v1',
    nearestKm: km,
    schemeLabel: point.schemeLabel,
    pointLabel: point.pointLabel,
    sourceUrl: point.sourceUrl,
    proximityScore0To100: scoreFromKm(km),
    dataLastReviewedIsoDate: LONDON_PLANNED_TRANSPORT_DATA_LAST_REVIEWED,
  };
};
