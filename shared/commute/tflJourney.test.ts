import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearTflJourneyCache, fetchTflTransitJourneyMinutes } from './tflJourney';

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
