import { describe, expect, it, vi } from 'vitest';

import {
  logCrimeScoreSearchDiagnostics,
  numericStatsForFiniteValues,
} from './crimeScoreSearchDiagnostics';

describe('numericStatsForFiniteValues', () => {
  it('returns null for empty input', () => {
    expect(numericStatsForFiniteValues([])).toBeNull();
  });

  it('computes mean and sample stddev', () => {
    const s = numericStatsForFiniteValues([10, 20, 30]);
    expect(s).not.toBeNull();
    expect(s?.n).toBe(3);
    expect(s?.min).toBe(10);
    expect(s?.max).toBe(30);
    expect(s?.mean).toBe(20);
    expect(s?.stddev).toBeCloseTo(10, 5);
  });

  it('filters non-finite values', () => {
    const s = numericStatsForFiniteValues([1, NaN, 3]);
    expect(s?.n).toBe(2);
    expect(s?.mean).toBe(2);
  });
});

describe('logCrimeScoreSearchDiagnostics', () => {
  it('no-ops when env flag is unset', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logCrimeScoreSearchDiagnostics([1, 2, 3], { candidateCount: 3 });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('logs JSON when HOUSING_FINDER_SCORING_DIAGNOSTICS=1', () => {
    const prev = process.env.HOUSING_FINDER_SCORING_DIAGNOSTICS;
    process.env.HOUSING_FINDER_SCORING_DIAGNOSTICS = '1';
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logCrimeScoreSearchDiagnostics([0, 50, 100], { candidateCount: 3 });
    expect(spy).toHaveBeenCalledTimes(1);
    const arg = String(spy.mock.calls[0]?.[0]);
    expect(arg).toContain('crime_score_search_diagnostics');
    expect(arg).toContain('"min":0');
    expect(arg).toContain('"max":100');
    process.env.HOUSING_FINDER_SCORING_DIAGNOSTICS = prev;
    spy.mockRestore();
  });
});
