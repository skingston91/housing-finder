import type { LondonBoroughMedianRow } from '../affordability/londonBoroughMedians';

import { nearestMapAreaDisplayName } from './nearestMapAreaLabel';
import { relativePositionHeading } from './relativePositionHeading';

/**
 * Result card / map title: `{distance or Near} · {neighbourhood or borough}`.
 * Used by the API and **re-applied in the browser** so headings stay correct even if
 * `sam build` was not run after changing shared ranking code.
 */
export const buildMapStyleAreaHeading = (
  workplace: { readonly latitude: number; readonly longitude: number },
  centroid: { readonly latitude: number; readonly longitude: number },
  medianRows: readonly LondonBoroughMedianRow[],
): string => {
  const rel = relativePositionHeading(
    workplace.latitude,
    workplace.longitude,
    centroid.latitude,
    centroid.longitude,
  );
  const place = nearestMapAreaDisplayName(centroid.latitude, centroid.longitude, medianRows);
  return `${rel} · ${place}`;
};
