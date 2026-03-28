import { describe, expect, it } from 'vitest';

import { affordabilityScoreFromMedian } from './affordabilityScoreFromMedian';

describe('affordabilityScoreFromMedian', () => {
  it('scores high when budget exceeds median', () => {
    expect(affordabilityScoreFromMedian(900_000, 500_000)).toBe(100);
  });

  it('scores low when budget is far below median', () => {
    expect(affordabilityScoreFromMedian(150_000, 600_000)).toBe(15);
  });
});
