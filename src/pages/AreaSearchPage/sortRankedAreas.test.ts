import { describe, expect, it } from 'vitest';

import type { RankedArea } from '@/domain/area/types';

import {
  compareRankedAreas,
  sortPartitionedByRouteConfirmation,
  sortRankedAreas,
} from './sortRankedAreas';

const baseArea = (overrides: Partial<RankedArea> = {}): RankedArea => ({
  id: 'a',
  displayName: 'Alpha',
  centroidLatitude: 51.5,
  centroidLongitude: -0.1,
  score: 50,
  breakdown: {
    affordability: 50,
    commute: 50,
    schools: 50,
    crime: 50,
    priceTrend: 50,
    sizeFit: 50,
  },
  ...overrides,
});

describe('sortRankedAreas', () => {
  it('sorts by headline descending (best first)', () => {
    const x = baseArea({ id: '1', displayName: 'Low', score: 40 });
    const y = baseArea({ id: '2', displayName: 'High', score: 80 });
    const out = sortRankedAreas([x, y], 'headline', 'desc');
    expect(out.map((a) => a.id)).toEqual(['2', '1']);
  });

  it('sorts by commute ascending (worst commute subscore first)', () => {
    const good = baseArea({
      id: 'g',
      displayName: 'Good',
      breakdown: { ...baseArea().breakdown, commute: 90 },
    });
    const bad = baseArea({
      id: 'b',
      displayName: 'Bad',
      breakdown: { ...baseArea().breakdown, commute: 20 },
    });
    const out = sortRankedAreas([good, bad], 'commute', 'asc');
    expect(out.map((a) => a.id)).toEqual(['b', 'g']);
  });

  it('ties break on display name', () => {
    const b = baseArea({ id: '2', displayName: 'B', score: 50 });
    const a = baseArea({ id: '1', displayName: 'A', score: 50 });
    const out = sortRankedAreas([b, a], 'headline', 'desc');
    expect(out.map((r) => r.displayName)).toEqual(['A', 'B']);
  });
});

describe('compareRankedAreas', () => {
  it('sorts NaN-like values last', () => {
    const nan = baseArea({
      id: 'n',
      score: Number.NaN,
    });
    const ok = baseArea({ id: 'o', score: 10 });
    expect(compareRankedAreas(nan, ok, 'headline', 'desc')).toBeGreaterThan(0);
    expect(compareRankedAreas(ok, nan, 'headline', 'desc')).toBeLessThan(0);
  });
});

describe('sortPartitionedByRouteConfirmation', () => {
  it('sorts within estimate-only and confirmed groups separately', () => {
    const estLow = baseArea({
      id: 'e1',
      displayName: 'EstLow',
      score: 40,
      metadata: { commuteRankTier: 1 },
    });
    const estHigh = baseArea({
      id: 'e2',
      displayName: 'EstHigh',
      score: 90,
      metadata: { commuteRankTier: 1 },
    });
    const conf = baseArea({
      id: 'c',
      displayName: 'Conf',
      score: 55,
      metadata: { commuteRankTier: 0 },
    });
    const { withConfirmedRoute, withoutConfirmedRoute } = sortPartitionedByRouteConfirmation(
      [estLow, conf, estHigh],
      'headline',
      'desc',
    );
    expect(withConfirmedRoute.map((a) => a.id)).toEqual(['c']);
    expect(withoutConfirmedRoute.map((a) => a.id)).toEqual(['e2', 'e1']);
  });
});
