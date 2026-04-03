import { describe, expect, it } from 'vitest';

import { applyCommuteReliabilityAdjustments } from './applyCommuteReliabilityAdjustments';

describe('applyCommuteReliabilityAdjustments', () => {
  it('returns base score when no reliability signals', () => {
    const r = applyCommuteReliabilityAdjustments({ baseScore: 88 });
    expect(r).toEqual({ score: 88, factor: 1 });
  });

  it('reduces score when disruption hint is present', () => {
    const r = applyCommuteReliabilityAdjustments({
      baseScore: 100,
      transitDisruptionHint: 'TfL flagged disruptions',
    });
    expect(r.factor).toBeCloseTo(0.92, 5);
    expect(r.score).toBe(92);
  });

  it('reduces score when alternative journey is much slower', () => {
    const r = applyCommuteReliabilityAdjustments({
      baseScore: 100,
      primaryJourneyMinutes: 30,
      alternativeJourneyMinutes: 40,
    });
    expect(r.factor).toBeCloseTo(0.97, 5);
    expect(r.score).toBe(97);
  });

  it('combines disruption and volatility factors', () => {
    const r = applyCommuteReliabilityAdjustments({
      baseScore: 100,
      transitDisruptionHint: 'x',
      primaryJourneyMinutes: 20,
      alternativeJourneyMinutes: 30,
    });
    expect(r.factor).toBeCloseTo(0.92 * 0.97, 5);
    expect(r.score).toBe(Math.round(100 * 0.92 * 0.97));
  });
});
