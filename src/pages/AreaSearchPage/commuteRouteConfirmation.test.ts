import { describe, expect, it } from 'vitest';

import type { RankedArea } from '@/domain/area/types';

import {
  commuteRankTierFromArea,
  partitionAreasByCommuteRouteConfirmation,
} from './commuteRouteConfirmation';

const area = (overrides: Partial<RankedArea> & { id: string }): RankedArea => ({
  id: overrides.id,
  displayName: overrides.displayName ?? 'A',
  centroidLatitude: 51.5,
  centroidLongitude: -0.1,
  score: overrides.score ?? 50,
  breakdown: overrides.breakdown ?? {
    affordability: 50,
    commute: 50,
    schools: 50,
    crime: 50,
    priceTrend: 50,
    sizeFit: 50,
  },
  ...(overrides.metadata !== undefined ? { metadata: overrides.metadata } : {}),
});

describe('commuteRouteConfirmation', () => {
  it('partitions by commuteRankTier metadata', () => {
    const { withConfirmedRoute, withoutConfirmedRoute } = partitionAreasByCommuteRouteConfirmation([
      area({ id: '1', metadata: { commuteRankTier: 0 } }),
      area({ id: '2', metadata: { commuteRankTier: 1 } }),
      area({ id: '3' }),
    ]);
    expect(withConfirmedRoute.map((a) => a.id)).toEqual(['1', '3']);
    expect(withoutConfirmedRoute.map((a) => a.id)).toEqual(['2']);
  });

  it('reads tier from metadata', () => {
    expect(commuteRankTierFromArea(area({ id: 'x', metadata: { commuteRankTier: 1 } }))).toBe(1);
    expect(commuteRankTierFromArea(area({ id: 'x' }))).toBe(0);
  });
});
