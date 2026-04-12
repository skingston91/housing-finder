import { describe, expect, it, vi } from 'vitest';

import * as resolveCommute from '../commute/resolveCommuteScore';
import type { SearchAreasRequestBody } from '../searchAreasContract';

import {
  MAX_TFL_MIXED_FALLBACK_RETRIES,
  retryTflFallbackCommutesWhenMixed,
} from './retryTflFallbackCommutesWhenMixed';

vi.mock('../commute/resolveCommuteScore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../commute/resolveCommuteScore')>();
  return {
    ...actual,
    resolveCommuteScore: vi.fn(),
  };
});

const body = (transit?: SearchAreasRequestBody['commute']['transit']): SearchAreasRequestBody => ({
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'Old Street', latitude: 51.5255, longitude: -0.0875 },
  commute: { maxMinutes: 45, mode: 'transit', ...(transit !== undefined ? { transit } : {}) },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 6, categoryWeights: { burglary: 1 } },
});

describe('retryTflFallbackCommutesWhenMixed', () => {
  it('does nothing when not mixed', async () => {
    const rows = [
      {
        c: { id: 'a', displayName: 'A', latitude: 51.5, longitude: -0.1 },
        base: { affordability: 50, schools: 50 },
        commuteRes: { score: 50, model: 'tfl-unified-api' as const },
      },
    ];
    const out = await retryTflFallbackCommutesWhenMixed(rows, body(), globalThis.fetch, {
      tfl: { appKey: 'k' },
    });
    expect(resolveCommute.resolveCommuteScore).not.toHaveBeenCalled();
    expect(out).toEqual(rows);
  });

  it('retries top fallback rows when mixed and promotes on second TfL success', async () => {
    vi.mocked(resolveCommute.resolveCommuteScore).mockReset();
    const routed = { score: 70, model: 'tfl-unified-api' as const, journeyMinutes: 30 };
    const fallback = {
      score: 40,
      model: 'tfl-fallback-straight-line' as const,
      transitFailureCode: 'timeout' as const,
    };
    vi.mocked(resolveCommute.resolveCommuteScore).mockResolvedValueOnce(routed);

    const rows = [
      {
        c: { id: 'r', displayName: 'R', latitude: 51.5, longitude: -0.1 },
        base: { affordability: 60, schools: 60 },
        commuteRes: { score: 70, model: 'tfl-unified-api' as const },
      },
      {
        c: { id: 'f', displayName: 'F', latitude: 51.46, longitude: -0.11 },
        base: { affordability: 90, schools: 90 },
        commuteRes: fallback,
      },
    ];

    const out = await retryTflFallbackCommutesWhenMixed(rows, body(), globalThis.fetch, {
      tfl: { appKey: 'k' },
    });

    expect(resolveCommute.resolveCommuteScore).toHaveBeenCalledTimes(1);
    expect(out[1]?.commuteRes).toEqual(routed);
  });

  it('retries with relaxed transit when filters yield no_journey_after_filters', async () => {
    vi.mocked(resolveCommute.resolveCommuteScore).mockReset();
    const relaxedOk = { score: 65, model: 'tfl-unified-api' as const, journeyMinutes: 35 };
    vi.mocked(resolveCommute.resolveCommuteScore)
      .mockResolvedValueOnce({
        score: 40,
        model: 'tfl-fallback-straight-line',
        transitFailureCode: 'no_journey_after_filters',
      })
      .mockResolvedValueOnce(relaxedOk);

    const rows = [
      {
        c: { id: 'r', displayName: 'R', latitude: 51.5, longitude: -0.1 },
        base: { affordability: 50, schools: 50 },
        commuteRes: { score: 70, model: 'tfl-unified-api' as const },
      },
      {
        c: { id: 'f', displayName: 'F', latitude: 51.46, longitude: -0.11 },
        base: { affordability: 80, schools: 80 },
        commuteRes: {
          score: 40,
          model: 'tfl-fallback-straight-line' as const,
          transitFailureCode: 'no_journey_after_filters' as const,
        },
      },
    ];

    const out = await retryTflFallbackCommutesWhenMixed(
      rows,
      body({ requireMultipleJourneys: true, includeAlternativeRoutes: true }),
      globalThis.fetch,
      { tfl: { appKey: 'k' } },
    );

    expect(resolveCommute.resolveCommuteScore).toHaveBeenCalledTimes(2);
    expect(out[1]?.commuteRes).toEqual(relaxedOk);
  });

  it('caps retries at MAX_TFL_MIXED_FALLBACK_RETRIES', async () => {
    vi.mocked(resolveCommute.resolveCommuteScore).mockReset();
    vi.mocked(resolveCommute.resolveCommuteScore).mockResolvedValue({
      score: 70,
      model: 'tfl-unified-api',
      journeyMinutes: 20,
    });

    const fb = {
      score: 30,
      model: 'tfl-fallback-straight-line' as const,
      transitFailureCode: 'timeout' as const,
    };
    const routed = { score: 70, model: 'tfl-unified-api' as const };
    const rows = [
      {
        c: { id: 'r', displayName: 'R', latitude: 51.5, longitude: -0.1 },
        base: { affordability: 50, schools: 50 },
        commuteRes: routed,
      },
      ...Array.from({ length: MAX_TFL_MIXED_FALLBACK_RETRIES + 4 }, (_, i) => ({
        c: { id: `f-${String(i)}`, displayName: `F${String(i)}`, latitude: 51.4, longitude: -0.11 },
        base: { affordability: 40, schools: 40 },
        commuteRes: fb,
      })),
    ];

    await retryTflFallbackCommutesWhenMixed(rows, body(), globalThis.fetch, {
      tfl: { appKey: 'k' },
    });

    expect(resolveCommute.resolveCommuteScore).toHaveBeenCalledTimes(
      MAX_TFL_MIXED_FALLBACK_RETRIES,
    );
  });
});
