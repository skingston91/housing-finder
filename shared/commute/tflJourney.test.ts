import { describe, expect, it, vi } from 'vitest';

import { fetchTflTransitJourneyMinutes } from './tflJourney';

describe('fetchTflTransitJourneyMinutes', () => {
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
      appId: 'id',
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
        appId: 'id',
        appKey: 'key',
      }),
    ).toBeNull();
  });
});
