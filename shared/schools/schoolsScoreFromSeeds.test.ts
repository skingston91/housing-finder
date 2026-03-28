import { describe, expect, it } from 'vitest';

import { schoolsScoreFromSeeds } from './schoolsScoreFromSeeds';

describe('schoolsScoreFromSeeds', () => {
  it('returns a bounded score near a seed', () => {
    const score = schoolsScoreFromSeeds({ phases: ['primary'] }, 51.5226, -0.1745);
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });
});
