import { bearingDegrees, bearingToCompass8, haversineKm } from './geo';

/** ~150 m — same threshold as the workplace grid “Near” band. */
const NEAR_KM = 0.15;

/**
 * Distance and compass from the workplace to a candidate point, e.g. `5.3 km SE` or `Near`.
 */
export const relativePositionHeading = (
  workplaceLat: number,
  workplaceLng: number,
  latitude: number,
  longitude: number,
): string => {
  const d = haversineKm(workplaceLat, workplaceLng, latitude, longitude);
  if (d < NEAR_KM) {
    return 'Near';
  }
  const bear = bearingDegrees(workplaceLat, workplaceLng, latitude, longitude);
  const compass = bearingToCompass8(bear);
  return `${d.toFixed(1)} km ${compass}`;
};
