import { describe, expect, it } from 'vitest';

import { normalizeSizeFitRatiosToScores } from './normalizeSizeFitRatiosToScores';

describe('normalizeSizeFitRatiosToScores', () => {
  it('maps min ratio to 0 and max to 100', () => {
    expect(normalizeSizeFitRatiosToScores([0.8, 1.0, 1.2])).toEqual([0, 50, 100]);
  });

  it('uses 50 for all-null', () => {
    expect(normalizeSizeFitRatiosToScores([null, null])).toEqual([50, 50]);
  });

  it('uses absolute headroom when cohort has no spread (equal ratios)', () => {
    expect(normalizeSizeFitRatiosToScores([1.1, 1.1])).toEqual([55, 55]);
  });

  it('maps a single candidate by absolute headroom', () => {
    expect(normalizeSizeFitRatiosToScores([1.2])).toEqual([60]);
  });
});
