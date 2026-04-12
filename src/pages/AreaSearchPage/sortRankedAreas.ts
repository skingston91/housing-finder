import type { RankedArea } from '@/domain/area/types';

import { partitionAreasByCommuteRouteConfirmation } from './commuteRouteConfirmation';

export type AreaSortKey =
  | 'headline'
  | 'affordability'
  | 'commute'
  | 'schools'
  | 'crime'
  | 'priceTrend'
  | 'sizeFit';

/** `asc` = low scores first; `desc` = high scores first (typical “best first”). */
export type SortDirection = 'asc' | 'desc';

const valueForSortKey = (area: RankedArea, key: AreaSortKey): number => {
  switch (key) {
    case 'headline':
      return area.score;
    case 'affordability':
      return area.breakdown.affordability;
    case 'commute':
      return area.breakdown.commute;
    case 'schools':
      return area.breakdown.schools;
    case 'crime':
      return area.breakdown.crime;
    case 'priceTrend':
      return area.breakdown.priceTrend;
    case 'sizeFit':
      return area.breakdown.sizeFit;
  }
};

/**
 * Stable tie-breaker on name so equal scores don’t reorder randomly.
 */
export const compareRankedAreas = (
  a: RankedArea,
  b: RankedArea,
  key: AreaSortKey,
  dir: SortDirection,
): number => {
  const va = valueForSortKey(a, key);
  const vb = valueForSortKey(b, key);
  const fa = Number.isFinite(va);
  const fb = Number.isFinite(vb);
  if (!fa && !fb) {
    return a.displayName.localeCompare(b.displayName);
  }
  if (!fa) {
    return 1;
  }
  if (!fb) {
    return -1;
  }
  const primary = dir === 'desc' ? vb - va : va - vb;
  if (primary !== 0) {
    return primary;
  }
  return a.displayName.localeCompare(b.displayName);
};

export const sortRankedAreas = (
  areas: readonly RankedArea[],
  key: AreaSortKey,
  dir: SortDirection,
): RankedArea[] => [...areas].sort((a, b) => compareRankedAreas(a, b, key, dir));

/**
 * Keeps confirmed-route rows ahead of estimate-only when both groups exist, and sorts inside each
 * group by the chosen column.
 */
export const sortPartitionedByRouteConfirmation = (
  areas: readonly RankedArea[],
  key: AreaSortKey,
  dir: SortDirection,
): {
  readonly withConfirmedRoute: readonly RankedArea[];
  readonly withoutConfirmedRoute: readonly RankedArea[];
} => {
  const { withConfirmedRoute, withoutConfirmedRoute } =
    partitionAreasByCommuteRouteConfirmation(areas);
  return {
    withConfirmedRoute: sortRankedAreas(withConfirmedRoute, key, dir),
    withoutConfirmedRoute: sortRankedAreas(withoutConfirmedRoute, key, dir),
  };
};
