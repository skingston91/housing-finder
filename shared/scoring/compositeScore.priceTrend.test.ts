import { describe, expect, it } from 'vitest';

import {
  compositeScore,
  compositeScoreWithPriceTrend,
  defaultWeightsWithPriceTrend,
} from './compositeScore';

describe('compositeScoreWithPriceTrend', () => {
  it('blends five dimensions with default weights', () => {
    const s = compositeScoreWithPriceTrend(
      {
        affordability: 100,
        commute: 0,
        schools: 0,
        crime: 0,
        priceTrend: 0,
      },
      defaultWeightsWithPriceTrend,
    );
    expect(s).toBe(24);
  });
});

describe('compositeScore (four-dim)', () => {
  it('unchanged when only four dimensions matter', () => {
    expect(
      compositeScore({
        affordability: 80,
        commute: 60,
        schools: 70,
        crime: 90,
      }),
    ).toBe(74);
  });
});
