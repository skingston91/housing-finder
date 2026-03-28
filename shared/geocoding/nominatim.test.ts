import { describe, expect, it, vi } from 'vitest';

import { geocodeWithNominatim } from './nominatim';

describe('geocodeWithNominatim', () => {
  it('parses first hit', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([{ lat: '51.5', lon: '-0.12', display_name: 'Test, London, UK' }]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    const hit = await geocodeWithNominatim('test', fetchImpl);
    expect(hit).toEqual({
      latitude: 51.5,
      longitude: -0.12,
      displayName: 'Test, London, UK',
    });
  });

  it('returns null for empty array', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
    );
    expect(await geocodeWithNominatim('nothing', fetchImpl)).toBeNull();
  });
});
