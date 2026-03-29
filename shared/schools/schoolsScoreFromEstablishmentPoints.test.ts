import { describe, expect, it } from 'vitest';

import { LONDON_SCHOOL_SEEDS } from './londonSchoolSeeds';
import { schoolsScoreFromEstablishmentPoints } from './schoolsScoreFromEstablishmentPoints';

describe('schoolsScoreFromEstablishmentPoints', () => {
  it('matches seeds-only behaviour for a coordinate on a seed', () => {
    const score = schoolsScoreFromEstablishmentPoints(
      { phases: ['primary'] },
      51.5226,
      -0.1745,
      LONDON_SCHOOL_SEEDS,
    );
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });
});
