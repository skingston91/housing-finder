import { describe, expect, it, vi } from 'vitest';

import type { SearchAreasRequestBody } from '../searchAreasContract';

import { resolveCommuteScore } from './resolveCommuteScore';

const transitBody = (maxMinutes: number): SearchAreasRequestBody => ({
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'A', latitude: 51.5, longitude: -0.1 },
  commute: { maxMinutes, mode: 'transit' },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 1, categoryWeights: { burglary: 1 } },
});

describe('resolveCommuteScore', () => {
  it('uses TfL when transit mode and credentials return a journey', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ journeys: [{ duration: 1200 }] }), { status: 200 }),
      ),
    );
    const r = await resolveCommuteScore(transitBody(45), 51.52, -0.08, fetchImpl, {
      appId: 'x',
      appKey: 'y',
    });
    expect(r.model).toBe('tfl-unified-api');
    expect(r.journeyMinutes).toBe(20);
    expect(r.score).toBe(100);
  });

  it('falls back when TfL returns no journey', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ journeys: [] }), { status: 200 })),
    );
    const r = await resolveCommuteScore(transitBody(45), 51.52, -0.08, fetchImpl, {
      appId: 'x',
      appKey: 'y',
    });
    expect(r.model).toBe('tfl-fallback-straight-line');
    expect(r.journeyMinutes).toBeUndefined();
  });

  it('uses straight-line when not transit', async () => {
    const fetchImpl = vi.fn();
    const body: SearchAreasRequestBody = {
      ...transitBody(45),
      commute: { maxMinutes: 45, mode: 'driving' },
    };
    const r = await resolveCommuteScore(body, 51.5001, -0.1001, fetchImpl, {
      appId: 'x',
      appKey: 'y',
    });
    expect(r.model).toBe('straight-line-time-estimate');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
