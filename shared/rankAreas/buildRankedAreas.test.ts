import { describe, expect, it, vi } from 'vitest';

import type { SearchAreasRequestBody } from '../searchAreasContract';

import { buildRankedAreas } from './buildRankedAreas';

const minimalBody: SearchAreasRequestBody = {
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'HQ', latitude: 51.5, longitude: -0.1 },
  commute: { maxMinutes: 30, mode: 'driving' },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 1, categoryWeights: { burglary: 2 } },
};

describe('buildRankedAreas', () => {
  it('ranks areas using mocked police.uk responses', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([{ category: 'burglary' }, { category: 'anti-social-behaviour' }]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const areas = await buildRankedAreas(minimalBody, fetchImpl, undefined);
    expect(areas.length).toBeGreaterThan(0);
    const first = areas[0];
    expect(first).toBeDefined();
    expect(first?.score).toBeTypeOf('number');
    expect(first?.displayName).toMatch(/.+/);
    expect(first?.metadata?.policeUk).toBe('ok');
    expect(first?.metadata?.candidateMode).toBe('workplace-grid');
    expect(fetchImpl.mock.calls.length).toBe(12);
  });

  it('uses TfL for transit when credentials provided', async () => {
    const body: SearchAreasRequestBody = {
      ...minimalBody,
      commute: { maxMinutes: 60, mode: 'transit' },
    };
    const requestToUrl = (input: RequestInfo | URL): string => {
      if (typeof input === 'string') {
        return input;
      }
      if (input instanceof URL) {
        return input.href;
      }
      return input.url;
    };

    const fetchImpl = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = requestToUrl(input);
      if (url.includes('data.police.uk')) {
        return Promise.resolve(
          new Response(JSON.stringify([{ category: 'burglary' }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      if (url.includes('api.tfl.gov.uk')) {
        return Promise.resolve(
          new Response(JSON.stringify({ journeys: [{ duration: 1800 }] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(new Response('{}', { status: 404 }));
    }) as typeof fetch;

    const areas = await buildRankedAreas(body, fetchImpl, {
      tfl: { appKey: 'test-key' },
    });
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0]?.metadata?.commuteModel).toBe('tfl-unified-api');
    expect(areas[0]?.metadata?.commuteJourneyMinutes).toBe(30);
  });
});
