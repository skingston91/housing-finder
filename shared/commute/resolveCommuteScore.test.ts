import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SearchAreasRequestBody } from '../searchAreasContract';

import { clearOrsDirectionsCache } from './orsDirections';
import { resolveCommuteScore } from './resolveCommuteScore';
import { clearTflJourneyCache } from './tflJourney';

const transitBody = (maxMinutes: number): SearchAreasRequestBody => ({
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'A', latitude: 51.5, longitude: -0.1 },
  commute: { maxMinutes, mode: 'transit' },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 1, categoryWeights: { burglary: 1 } },
});

describe('resolveCommuteScore', () => {
  beforeEach(() => {
    clearTflJourneyCache();
    clearOrsDirectionsCache();
  });

  it('uses TfL when transit mode and credentials return a journey', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ journeys: [{ duration: 1200 }] }), { status: 200 }),
      ),
    );
    const r = await resolveCommuteScore(transitBody(45), 51.52, -0.08, fetchImpl, {
      tfl: { appKey: 'y' },
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
      tfl: { appKey: 'y' },
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
      tfl: { appKey: 'y' },
    });
    expect(r.model).toBe('straight-line-time-estimate');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('uses OpenRouteService when driving and API key returns a route', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ routes: [{ summary: { duration: 2700, distance: 8000 } }] }),
          {
            status: 200,
          },
        ),
      ),
    );
    const body: SearchAreasRequestBody = {
      ...transitBody(45),
      commute: { maxMinutes: 60, mode: 'driving' },
    };
    const r = await resolveCommuteScore(body, 51.52, -0.08, fetchImpl, {
      openRouteService: { apiKey: 'ors' },
    });
    expect(r.model).toBe('openrouteservice-directions');
    expect(r.journeyMinutes).toBe(45);
    expect(r.score).toBe(100);
  });

  it('falls back when OpenRouteService returns no route', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    const body: SearchAreasRequestBody = {
      ...transitBody(45),
      commute: { maxMinutes: 45, mode: 'cycling' },
    };
    const r = await resolveCommuteScore(body, 51.52, -0.08, fetchImpl, {
      openRouteService: { apiKey: 'ors' },
    });
    expect(r.model).toBe('openrouteservice-fallback-straight-line');
    expect(r.journeyMinutes).toBeUndefined();
  });
});
