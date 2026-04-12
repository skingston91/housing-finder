import { describe, expect, it } from 'vitest';

import { CRIME_SCORE_WHEN_POLICE_UNAVAILABLE } from './crimeScoreWhenPoliceUnavailable';
import {
  applyCrimeMonthCompleteness,
  crimeScoresNormalizedAmongCandidates,
} from './crimeScoresNormalizedAmongCandidates';

describe('crimeScoresNormalizedAmongCandidates', () => {
  it('assigns higher score to lower weighted crime load', () => {
    const scores = crimeScoresNormalizedAmongCandidates([
      { weightedAvgPerMonth: 8000, policeUk: 'ok' },
      { weightedAvgPerMonth: 4000, policeUk: 'ok' },
    ]);
    expect(scores[0]).toBe(0);
    expect(scores[1]).toBe(100);
  });

  it('uses conservative score when police data failed', () => {
    const scores = crimeScoresNormalizedAmongCandidates([
      { weightedAvgPerMonth: 100, policeUk: 'error' },
      { weightedAvgPerMonth: 300, policeUk: 'ok' },
      { weightedAvgPerMonth: 100, policeUk: 'ok' },
    ]);
    expect(scores[0]).toBe(CRIME_SCORE_WHEN_POLICE_UNAVAILABLE);
    expect(scores[1]).toBe(0);
    expect(scores[2]).toBe(100);
  });

  it('ties at neutral when all loaded values are equal', () => {
    const scores = crimeScoresNormalizedAmongCandidates([
      { weightedAvgPerMonth: 5000, policeUk: 'ok' },
      { weightedAvgPerMonth: 5000, policeUk: 'partial' },
    ]);
    expect(scores[0]).toBe(50);
    expect(scores[1]).toBe(50);
  });
});

describe('applyCrimeMonthCompleteness', () => {
  it('leaves score unchanged when all months succeeded', () => {
    expect(applyCrimeMonthCompleteness(80, 6, 6)).toBe(80);
  });

  it('pulls score toward neutral when months are missing', () => {
    expect(applyCrimeMonthCompleteness(100, 3, 6)).toBe(75);
    expect(applyCrimeMonthCompleteness(0, 3, 6)).toBe(25);
  });
});
