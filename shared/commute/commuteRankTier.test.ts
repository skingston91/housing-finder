import { describe, expect, it } from 'vitest';

import { commuteRankTierForModel } from './commuteRankTier';

describe('commuteRankTierForModel', () => {
  it('is 1 for routing API fallbacks', () => {
    expect(commuteRankTierForModel('tfl-fallback-straight-line')).toBe(1);
    expect(commuteRankTierForModel('openrouteservice-fallback-straight-line')).toBe(1);
  });

  it('is 0 for routed journeys and plain straight-line estimates', () => {
    expect(commuteRankTierForModel('tfl-unified-api')).toBe(0);
    expect(commuteRankTierForModel('openrouteservice-directions')).toBe(0);
    expect(commuteRankTierForModel('straight-line-time-estimate')).toBe(0);
  });
});
