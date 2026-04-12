import { describe, expect, it } from 'vitest';

import { normalizeCommuteScoresAmongCandidates } from './normalizeCommuteScoresAmongCandidates';

describe('normalizeCommuteScoresAmongCandidates', () => {
  it('returns single score unchanged', () => {
    expect(normalizeCommuteScoresAmongCandidates([88])).toEqual([88]);
  });

  it('min-max spreads two scores to 0 and 100', () => {
    expect(normalizeCommuteScoresAmongCandidates([80, 100])).toEqual([0, 100]);
  });

  it('uses neutral 50 when all values tie', () => {
    expect(normalizeCommuteScoresAmongCandidates([100, 100, 100])).toEqual([50, 50, 50]);
  });
});
