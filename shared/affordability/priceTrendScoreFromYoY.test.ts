import { describe, expect, it } from 'vitest';

import { normalizeYoYPctToScores } from './priceTrendScoreFromYoY';

describe('normalizeYoYPctToScores', () => {
  it('maps min and max to 0 and 100', () => {
    expect(normalizeYoYPctToScores([-2, 0, 8])).toEqual([0, 20, 100]);
  });

  it('uses neutral 50 when all values are null', () => {
    expect(normalizeYoYPctToScores([null, null])).toEqual([50, 50]);
  });

  it('uses neutral 50 when all YoY values are identical', () => {
    expect(normalizeYoYPctToScores([3, 3, 3])).toEqual([50, 50, 50]);
  });
});
