import { describe, expect, it, vi } from 'vitest';

import { geocodeWithMapbox } from './mapboxGeocode';

describe('geocodeWithMapbox', () => {
  it('parses first feature center and place_name', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            features: [
              {
                place_name: 'Old Street, London',
                center: [-0.0875, 51.5255],
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const hit = await geocodeWithMapbox('Old Street', fetchImpl, 'token');
    expect(hit).toEqual({
      latitude: 51.5255,
      longitude: -0.0875,
      displayName: 'Old Street, London',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    type FetchArgs = Parameters<typeof fetch>;
    const calls = fetchImpl.mock.calls as unknown as FetchArgs[];
    const input = calls[0]?.[0];
    expect(input).toBeDefined();
    if (input === undefined) {
      throw new Error('expected fetch input');
    }
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      url = input.url;
    }
    expect(url).toContain('access_token=token');
    expect(url).toContain('country=gb');
  });

  it('returns null when features empty', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ features: [] }), { status: 200 })),
    );
    expect(await geocodeWithMapbox('x', fetchImpl, 't')).toBeNull();
  });
});
