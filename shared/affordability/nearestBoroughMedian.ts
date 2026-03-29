import { haversineKm } from '../rankAreas/geo';

import { LONDON_BOROUGH_MEDIANS, type LondonBoroughMedianRow } from './londonBoroughMedians';

export const nearestBoroughMedianFromRows = (
  latitude: number,
  longitude: number,
  rows: readonly LondonBoroughMedianRow[],
): LondonBoroughMedianRow => {
  let best = rows[0];
  if (!best) {
    throw new Error('nearestBoroughMedianFromRows: empty rows');
  }
  let bestKm = haversineKm(latitude, longitude, best.latitude, best.longitude);
  for (const row of rows) {
    const km = haversineKm(latitude, longitude, row.latitude, row.longitude);
    if (km < bestKm) {
      bestKm = km;
      best = row;
    }
  }
  return best;
};

export const nearestBoroughMedian = (latitude: number, longitude: number): LondonBoroughMedianRow =>
  nearestBoroughMedianFromRows(latitude, longitude, LONDON_BOROUGH_MEDIANS);
