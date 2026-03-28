import { describe, expect, it } from 'vitest';

import {
  affordabilityScoreForAreaSearch,
  affordabilityScoreFromMedian,
  affordabilityScoreFromPerM2Cap,
} from './affordabilityScoreFromMedian';

describe('affordabilityScoreFromMedian', () => {
  it('scores high when budget exceeds median', () => {
    expect(affordabilityScoreFromMedian(900_000, 500_000)).toBe(100);
  });

  it('scores low when budget is far below median', () => {
    expect(affordabilityScoreFromMedian(150_000, 600_000)).toBe(15);
  });
});

describe('affordabilityScoreFromPerM2Cap', () => {
  it('scores high for generous £/m² cap', () => {
    expect(affordabilityScoreFromPerM2Cap(10_000)).toBe(100);
  });

  it('scores low for tight £/m² cap', () => {
    expect(affordabilityScoreFromPerM2Cap(2000)).toBe(20);
  });
});

describe('affordabilityScoreForAreaSearch', () => {
  it('blends median and £/m² when both apply', () => {
    const baseOnly = affordabilityScoreFromMedian(500_000, 500_000);
    const withPerM2 = affordabilityScoreForAreaSearch(500_000, 500_000, 5000);
    expect(withPerM2).not.toBe(baseOnly);
    expect(withPerM2).toBeGreaterThanOrEqual(0);
    expect(withPerM2).toBeLessThanOrEqual(100);
  });

  it('ignores undefined £/m²', () => {
    expect(affordabilityScoreForAreaSearch(500_000, 500_000, undefined)).toBe(
      affordabilityScoreFromMedian(500_000, 500_000),
    );
  });
});
