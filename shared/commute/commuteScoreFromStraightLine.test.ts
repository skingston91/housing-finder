import { describe, expect, it } from 'vitest';

import { commuteScoreFromStraightLine } from './commuteScoreFromStraightLine';

describe('commuteScoreFromStraightLine', () => {
  it('scores 100 when estimate is well within max minutes', () => {
    const s = commuteScoreFromStraightLine(51.5, -0.1, 51.5001, -0.1001, 'walking', 45);
    expect(s).toBe(100);
  });

  it('scores 0 when estimate far exceeds max', () => {
    const s = commuteScoreFromStraightLine(51.2, -0.5, 51.7, 0.15, 'walking', 5);
    expect(s).toBe(0);
  });
});
