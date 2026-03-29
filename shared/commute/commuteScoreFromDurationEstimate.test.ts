import { describe, expect, it } from 'vitest';

import { commuteScoreFromDurationEstimate } from './commuteScoreFromDurationEstimate';

describe('commuteScoreFromDurationEstimate', () => {
  it('scores 100 when well within max', () => {
    expect(commuteScoreFromDurationEstimate(10, 45)).toBe(100);
  });

  it('scores 0 when far over max', () => {
    expect(commuteScoreFromDurationEstimate(100, 45)).toBe(0);
  });
});
