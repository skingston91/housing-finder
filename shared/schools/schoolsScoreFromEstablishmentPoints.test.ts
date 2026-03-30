import { describe, expect, it } from 'vitest';

import type { LondonSchoolSeed } from './londonSchoolSeeds';
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
    // When candidate == seed:
    // - distance score = 100
    // - seed performance (primary) = 95
    // - blended score = round(100 * 0.65 + 95 * 0.35) = 98
    expect(score).toBe(98);
  });

  it('blends performance when performanceByPhase is present', () => {
    const points: readonly LondonSchoolSeed[] = [
      {
        latitude: 0,
        longitude: 0,
        phases: ['primary'],
        performanceByPhase: { primary: 30 },
      },
    ];

    const score = schoolsScoreFromEstablishmentPoints({ phases: ['primary'] }, 0, 0, points);
    // distanceScore=100, performanceScore=30:
    // round(100 * 0.65 + 30 * 0.35) = round(75.5) = 76
    expect(score).toBe(76);
  });

  it('falls back to distance score when performance is missing', () => {
    const points: readonly LondonSchoolSeed[] = [
      {
        latitude: 0,
        longitude: 0,
        phases: ['primary'],
      },
    ];

    const score = schoolsScoreFromEstablishmentPoints({ phases: ['primary'] }, 0, 0, points);
    expect(score).toBe(100);
  });
});
