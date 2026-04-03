import { describe, expect, it } from 'vitest';

import { compositeScore } from '@/domain/scoring/compositeScore';

describe('compositeScore', () => {
  it('returns weighted average of subscores', () => {
    const score = compositeScore({
      affordability: 80,
      commute: 60,
      schools: 70,
      crime: 90,
      priceTrend: 50,
    });
    expect(score).toBe(74);
  });

  it('returns 0 when all weights are zero', () => {
    expect(
      compositeScore(
        {
          affordability: 50,
          commute: 50,
          schools: 50,
          crime: 50,
          priceTrend: 50,
        },
        {
          weights: {
            affordability: 0,
            commute: 0,
            schools: 0,
            crime: 0,
          },
        },
      ),
    ).toBe(0);
  });
});
