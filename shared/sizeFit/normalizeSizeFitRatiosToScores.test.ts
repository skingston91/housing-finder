import { describe, expect, it } from 'vitest';

import { normalizeSizeFitRatiosToScores } from './normalizeSizeFitRatiosToScores';

describe('normalizeSizeFitRatiosToScores', () => {
  it('maps min ratio to 0 and max to 100', () => {
    expect(normalizeSizeFitRatiosToScores([0.8, 1.0, 1.2])).toEqual([0, 50, 100]);
  });

  it('uses 50 for all-null', () => {
    expect(normalizeSizeFitRatiosToScores([null, null])).toEqual([50, 50]);
  });

  it('uses 50 when all ratios equal', () => {
    expect(normalizeSizeFitRatiosToScores([1.1, 1.1])).toEqual([50, 50]);
  });
});
