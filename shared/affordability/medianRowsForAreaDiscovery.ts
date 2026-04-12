import type { LondonBoroughMedianRow } from './londonBoroughMedians';
import { SOUTH_EAST_COMMUTER_MEDIAN_ANCHORS } from './southEastCommuterMedianAnchors';

/**
 * London borough rows (static or live UK HPI–merged) plus outer South East median anchors for
 * {@link scoreAffordabilitySchoolsDimensions} and map labelling.
 */
export const medianRowsForAreaDiscovery = (
  londonRows: readonly LondonBoroughMedianRow[],
): readonly LondonBoroughMedianRow[] => [...londonRows, ...SOUTH_EAST_COMMUTER_MEDIAN_ANCHORS];
