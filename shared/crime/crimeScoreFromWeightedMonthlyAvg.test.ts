import { describe, expect, it } from 'vitest';

import { crimeScoreFromWeightedMonthlyAvg } from './crimeScoreFromWeightedMonthlyAvg';

describe('crimeScoreFromWeightedMonthlyAvg', () => {
  it('maps zero to 100', () => {
    expect(crimeScoreFromWeightedMonthlyAvg(0)).toBe(100);
  });

  it('clamps low scores', () => {
    expect(crimeScoreFromWeightedMonthlyAvg(100)).toBe(0);
  });
});
