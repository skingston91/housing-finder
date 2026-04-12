import type { RankedArea } from '@/domain/area/types';

/** **0** = confirmed network route or plain straight-line (no API); **1** = API tried, estimate only. */
export const commuteRankTierFromArea = (area: RankedArea): 0 | 1 => {
  const t = area.metadata?.commuteRankTier;
  return t === 1 ? 1 : 0;
};

export const partitionAreasByCommuteRouteConfirmation = (
  areas: readonly RankedArea[],
): {
  readonly withConfirmedRoute: readonly RankedArea[];
  readonly withoutConfirmedRoute: readonly RankedArea[];
} => {
  const withConfirmedRoute: RankedArea[] = [];
  const withoutConfirmedRoute: RankedArea[] = [];
  for (const a of areas) {
    if (commuteRankTierFromArea(a) === 1) {
      withoutConfirmedRoute.push(a);
    } else {
      withConfirmedRoute.push(a);
    }
  }
  return { withConfirmedRoute, withoutConfirmedRoute };
};
