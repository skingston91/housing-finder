import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearTflJourneyCache,
  fetchTflTransitJourney,
  fetchTflTransitJourneyMinutes,
  summarizeJourneyRoute,
} from './tflJourney';

describe('summarizeJourneyRoute', () => {
  it('joins leg modes and instruction summaries', () => {
    const j = {
      legs: [
        {
          mode: { id: 'walking', name: 'Walking' },
          instruction: { summary: 'Walk to Station A' },
        },
        {
          mode: { id: 'tube', name: 'Tube' },
          instruction: { summary: 'Northern line to X' },
          routeOptions: [{ name: 'Northern' }],
        },
      ],
    };
    expect(summarizeJourneyRoute(j)).toMatch(/Walk to Station A/);
    expect(summarizeJourneyRoute(j)).toMatch(/Tube/);
  });
});

describe('fetchTflTransitJourneyMinutes', () => {
  beforeEach(() => {
    clearTflJourneyCache();
  });

  it('parses duration seconds into minutes', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ journeys: [{ duration: 2700 }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const mins = await fetchTflTransitJourneyMinutes(51.5, -0.1, 51.52, -0.08, fetchImpl, {
      appKey: 'key',
    });
    expect(mins).toBe(45);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns null on empty journeys', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ journeys: [] }), { status: 200 })),
    );
    expect(
      await fetchTflTransitJourneyMinutes(51, -0.1, 51.02, -0.1, fetchImpl, {
        appKey: 'key',
      }),
    ).toBeNull();
  });

  it('reuses cached journey for the same rounded coordinate pair', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ journeys: [{ duration: 600 }] }), { status: 200 }),
      ),
    );
    const creds = { appKey: 'key' };
    const a = await fetchTflTransitJourneyMinutes(51.5, -0.1, 51.52, -0.08, fetchImpl, creds);
    const b = await fetchTflTransitJourneyMinutes(
      51.50001,
      -0.10001,
      51.52001,
      -0.08001,
      fetchImpl,
      creds,
    );
    expect(a).toBe(10);
    expect(b).toBe(10);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('fetchTflTransitJourney', () => {
  beforeEach(() => {
    clearTflJourneyCache();
  });

  it('retries with nationalSearch when the first response has no journeys', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ journeys: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ journeys: [{ duration: 1800 }] }), { status: 200 }),
      );
    const r = await fetchTflTransitJourney(51.526, 0.022, 51.5, -0.09, fetchImpl, {
      appKey: 'key',
    });
    expect(r.minutes).toBe(30);
    expect(r.failureCode).toBeUndefined();
    expect(r.tflRawJourneyCount).toBe(1);
    expect(r.tflQualifyingJourneyCount).toBe(1);
    expect(r.nationalSearchUsed).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const secondUrl = String(fetchImpl.mock.calls[1]?.[0]);
    expect(secondUrl).toContain('nationalSearch=true');
  });

  it('does not retry national search when the first response already has journeys', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ journeys: [{ duration: 600 }] }), { status: 200 }),
      ),
    );
    const r = await fetchTflTransitJourney(51.5, -0.1, 51.52, -0.08, fetchImpl, { appKey: 'k' });
    expect(r.minutes).toBe(10);
    expect(r.tflRawJourneyCount).toBe(1);
    expect(r.tflQualifyingJourneyCount).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const firstCall = fetchImpl.mock.calls[0] as [string] | undefined;
    const firstUrl = String(firstCall?.[0]);
    expect(firstUrl).toContain('useRealTimeLiveArrivals=false');
    expect(firstUrl).toContain('walkingSpeed=average');
    expect(firstUrl).toMatch(/date=\d{8}/);
  });

  it('retries once on 429 then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ journeys: [{ duration: 600 }] }), { status: 200 }),
      );
    const r = await fetchTflTransitJourney(1, 2, 3, 4, fetchImpl, { appKey: 'k' });
    expect(r.minutes).toBe(10);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  }, 15_000);

  it('retries once on fetch failure (timeout path) then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('aborted'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ journeys: [{ duration: 600 }] }), { status: 200 }),
      );
    const r = await fetchTflTransitJourney(11, 12, 13, 14, fetchImpl, { appKey: 'k' });
    expect(r.minutes).toBe(10);
    expect(r.failureCode).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  }, 15_000);

  it('exposes failure code when http errors persist after rate-limit retry', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response('', { status: 429 })));
    const r = await fetchTflTransitJourney(1, 2, 3, 4, fetchImpl, { appKey: 'k' });
    expect(r.minutes).toBeNull();
    expect(r.failureCode).toBe('http_error');
    expect(r.httpStatus).toBe(429);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  }, 15_000);

  it('includes a short TfL error body snippet when HTTP is non-success', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response('Invalid app_key is provided.', { status: 429 })),
    );
    const r = await fetchTflTransitJourney(1, 2, 3, 4, fetchImpl, { appKey: 'k' });
    expect(r.failureCode).toBe('http_error');
    expect(r.httpStatus).toBe(429);
    expect(r.tflHttpErrorBody).toBe('Invalid app_key is provided.');
  }, 15_000);

  it('falls back to modes without national-rail after http error', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ journeys: [{ duration: 1200 }] }), { status: 200 }),
      );
    const r = await fetchTflTransitJourney(51.5, -0.1, 51.52, -0.08, fetchImpl, { appKey: 'k' });
    expect(r.minutes).toBe(20);
    const secondUrl = String(fetchImpl.mock.calls[1]?.[0]);
    expect(secondUrl).not.toContain('national-rail');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not cache failed planner responses', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ journeys: [] }), { status: 200 })),
    );
    const creds = { appKey: 'key' };
    await fetchTflTransitJourney(2, 2, 2, 2, fetchImpl, creds);
    await fetchTflTransitJourney(2, 2, 2, 2, fetchImpl, creds);
    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it('caches successful planner responses', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ journeys: [{ duration: 600 }] }), { status: 200 }),
      ),
    );
    const creds = { appKey: 'key' };
    await fetchTflTransitJourney(3, 3, 3, 3, fetchImpl, creds);
    await fetchTflTransitJourney(3, 3, 3, 3, fetchImpl, creds);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('surfaces disruption hint from journey legs', async () => {
    const payload = {
      journeys: [
        {
          duration: 600,
          legs: [{ mode: { id: 'tube' }, disruptions: [{ severity: 'serious' }] }],
        },
      ],
    };
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })),
    );
    const r = await fetchTflTransitJourney(51.5, -0.1, 51.52, -0.08, fetchImpl, { appKey: 'k' });
    expect(r.disruptionHint).toMatch(/disruption/i);
  });

  it('filters journeys that use an avoided line id', async () => {
    const payload = {
      journeys: [
        {
          duration: 600,
          legs: [
            {
              mode: { id: 'tube' },
              routeOptions: [{ lineIdentifier: { id: 'victoria' } }],
            },
          ],
        },
        {
          duration: 900,
          legs: [
            {
              mode: { id: 'tube' },
              routeOptions: [{ lineIdentifier: { id: 'central' } }],
            },
          ],
        },
      ],
    };
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })),
    );
    const r = await fetchTflTransitJourney(
      51.5,
      -0.1,
      51.52,
      -0.08,
      fetchImpl,
      { appKey: 'k' },
      {
        avoidLineIds: ['victoria'],
      },
    );
    // Only the non–Victoria journey qualifies; median of one option is that duration.
    expect(r.minutes).toBe(15);
    expect(r.tflRawJourneyCount).toBe(2);
    expect(r.tflQualifyingJourneyCount).toBe(1);
    expect(r.durationMethod).toBe('median-first-three-qualifying');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports raw vs qualifying counts when filters remove all journeys', async () => {
    const payload = {
      journeys: [
        {
          duration: 600,
          legs: [
            {
              mode: { id: 'tube' },
              routeOptions: [{ lineIdentifier: { id: 'victoria' } }],
            },
          ],
        },
      ],
    };
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })),
    );
    const r = await fetchTflTransitJourney(
      51.5,
      -0.1,
      51.52,
      -0.08,
      fetchImpl,
      { appKey: 'k' },
      { avoidLineIds: ['victoria'] },
    );
    expect(r.minutes).toBeNull();
    expect(r.failureCode).toBe('no_journey_after_filters');
    expect(r.tflRawJourneyCount).toBe(1);
    expect(r.tflQualifyingJourneyCount).toBe(0);
  });

  it('reports qualifying count when two routes are required but only one qualifies', async () => {
    const payload = {
      journeys: [{ duration: 600, legs: [{ mode: { id: 'tube' } }] }],
    };
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })),
    );
    const r = await fetchTflTransitJourney(
      51.5,
      -0.1,
      51.52,
      -0.08,
      fetchImpl,
      { appKey: 'k' },
      { requireMultipleJourneys: true },
    );
    expect(r.minutes).toBeNull();
    expect(r.failureCode).toBe('no_journey_after_filters');
    expect(r.tflRawJourneyCount).toBe(1);
    expect(r.tflQualifyingJourneyCount).toBe(1);
  });

  it('uses median of first three journeys when TfL returns three options', async () => {
    const payload = {
      journeys: [
        { duration: 600, legs: [] },
        { duration: 1200, legs: [] },
        { duration: 1800, legs: [] },
      ],
    };
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })),
    );
    const r = await fetchTflTransitJourney(51.5, -0.1, 51.52, -0.08, fetchImpl, { appKey: 'k' });
    expect(r.minutes).toBe(20);
    expect(r.durationMethod).toBe('median-first-three-qualifying');
  });

  it('uses a separate cache entry when planner preferences differ', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ journeys: [{ duration: 600 }] }), { status: 200 }),
      ),
    );
    const creds = { appKey: 'key' };
    await fetchTflTransitJourney(51.5, -0.1, 51.52, -0.08, fetchImpl, creds, {
      journeyPreference: 'least_time',
    });
    await fetchTflTransitJourney(51.5, -0.1, 51.52, -0.08, fetchImpl, creds, {
      journeyPreference: 'least_interchange',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
