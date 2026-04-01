import { describe, expect, it } from 'vitest';

import { mergePerformanceIntoSchoolSeeds } from './mergePerformanceIntoSchoolSeeds';

describe('mergePerformanceIntoSchoolSeeds', () => {
  it('merges DfE scores by URN and overrides overlapping phases', () => {
    const out = mergePerformanceIntoSchoolSeeds(
      [
        {
          latitude: 51,
          longitude: -0.1,
          urn: '123',
          phases: ['primary'],
          performanceByPhase: { primary: 50 },
        },
        {
          latitude: 51.1,
          longitude: -0.2,
          phases: ['secondary'],
        },
      ],
      {
        '123': { primary: 88 },
        '999': { secondary: 70 },
      },
    );
    expect(out[0]?.performanceByPhase?.primary).toBe(88);
    expect(out[1]).toEqual({
      latitude: 51.1,
      longitude: -0.2,
      phases: ['secondary'],
    });
  });

  it('ignores missing URN or unknown URN', () => {
    const seed = {
      latitude: 51,
      longitude: -0.1,
      phases: ['primary' as const],
    };
    expect(mergePerformanceIntoSchoolSeeds([seed], { '1': { primary: 99 } })[0]).toEqual(seed);
  });

  it('clamps merged values to 0–100', () => {
    const out = mergePerformanceIntoSchoolSeeds(
      [{ latitude: 51, longitude: -0.1, urn: '1', phases: ['primary'] }],
      { '1': { primary: 150 } },
    );
    expect(out[0]?.performanceByPhase?.primary).toBe(100);
  });
});
