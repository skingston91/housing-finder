import { haversineKm } from '../rankAreas/geo';

import { LONDON_BOROUGH_MEDIANS, type LondonBoroughMedianRow } from './londonBoroughMedians';

export const nearestBoroughMedian = (
  latitude: number,
  longitude: number,
): LondonBoroughMedianRow => {
  let best = LONDON_BOROUGH_MEDIANS[0];
  if (!best) {
    throw new Error('londonBoroughMedians: empty');
  }
  let bestKm = haversineKm(latitude, longitude, best.latitude, best.longitude);
  for (const row of LONDON_BOROUGH_MEDIANS) {
    const km = haversineKm(latitude, longitude, row.latitude, row.longitude);
    if (km < bestKm) {
      bestKm = km;
      best = row;
    }
  }
  return best;
};
