import { describe, expect, it, vi } from 'vitest';

import { geocodeUkWorkplace } from './geocodeUkWorkplace';

const requestToUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
};

describe('geocodeUkWorkplace', () => {
  it('uses Nominatim when no Mapbox token', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ lat: '51.5', lon: '-0.12', display_name: 'London, UK' }]), {
          status: 200,
        }),
      ),
    );
    const hit = await geocodeUkWorkplace('London', fetchImpl);
    expect(hit?.provider).toBe('nominatim');
    expect(hit?.displayName).toBe('London, UK');
  });

  it('prefers Mapbox when token set and Mapbox returns a feature', async () => {
    const fetchImpl = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = requestToUrl(input);
      if (url.includes('api.mapbox.com')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              features: [{ place_name: 'Mbox', center: [-0.1, 51.5] }],
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response('[]', { status: 200 }));
    }) as typeof fetch;
    const hit = await geocodeUkWorkplace('q', fetchImpl, { mapboxAccessToken: 'tok' });
    expect(hit?.provider).toBe('mapbox');
    expect(hit?.displayName).toBe('Mbox');
  });

  it('falls back to Nominatim when Mapbox errors', async () => {
    const fetchImpl = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = requestToUrl(input);
      if (url.includes('api.mapbox.com')) {
        return Promise.resolve(new Response('{}', { status: 401 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify([{ lat: '51', lon: '-0.1', display_name: 'Nomi' }]), {
          status: 200,
        }),
      );
    }) as typeof fetch;
    const hit = await geocodeUkWorkplace('q', fetchImpl, { mapboxAccessToken: 'bad' });
    expect(hit?.provider).toBe('nominatim');
    expect(hit?.displayName).toBe('Nomi');
  });
});
