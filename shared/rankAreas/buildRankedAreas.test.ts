import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LondonBoroughMedianRow } from '../affordability/londonBoroughMedians';
import { LONDON_BOROUGH_MEDIANS } from '../affordability/londonBoroughMedians';
import { clearLondonBoroughMedianCache } from '../affordability/resolveLondonBoroughMedianRows';
import { clearStreetCrimesCache } from '../policeUk/streetCrimes';
import { UKHPI_REGION_SLUG_BY_BOROUGH_ID } from '../affordability/ukhpiRegionSlugByBoroughId';
import { clearOrsDirectionsCache } from '../commute/orsDirections';
import { clearTflJourneyCache } from '../commute/tflJourney';
import type { SearchAreasRequestBody } from '../searchAreasContract';

import { CRIME_SCORE_WHEN_POLICE_UNAVAILABLE } from '../crime/crimeScoreWhenPoliceUnavailable';
import { recentMonthsYm } from '../crime/recentMonthsYm';
import { buildRankedAreas } from './buildRankedAreas';
import { MAX_SEARCH_CANDIDATES } from './workplaceGridCandidates';

const ukhpiSlug = (row: LondonBoroughMedianRow): string => {
  const s = UKHPI_REGION_SLUG_BY_BOROUGH_ID[row.id];
  if (s === undefined) {
    throw new Error(`Missing UKHPI slug for ${row.id}`);
  }
  return s;
};

const minimalBody: SearchAreasRequestBody = {
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'HQ', latitude: 51.5, longitude: -0.1 },
  commute: { maxMinutes: 30, mode: 'driving' },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 1, categoryWeights: { burglary: 2 } },
};

describe('buildRankedAreas', () => {
  beforeEach(() => {
    clearTflJourneyCache();
    clearOrsDirectionsCache();
    clearLondonBoroughMedianCache();
    clearStreetCrimesCache();
  });

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

    const { areas } = await buildRankedAreas(minimalBody, fetchImpl, undefined);
    expect(areas.length).toBeGreaterThan(0);
    const first = areas[0];
    expect(first).toBeDefined();
    expect(first?.score).toBeTypeOf('number');
    expect(first?.displayName).toMatch(/.+/);
    expect(first?.displayName).toMatch(/· .+/);
    expect(first?.displayName).not.toContain('HQ');
    expect(first?.metadata?.policeUk).toBe('ok');
    expect(first?.metadata?.candidateMode).toBe('workplace-grid');
    expect(first?.metadata?.futureTransportModel).toBe('london-planned-point-proximity-v1');
    expect(typeof first?.metadata?.futureTransportProximityScore).toBe('number');
    expect(first?.metadata?.futureTransportDataLastReviewed).toBe('2026-04-03');
    expect(typeof first?.breakdown.sizeFit).toBe('number');
    expect(first?.metadata?.sizeFitModel).toBe('not-requested');
    expect(fetchImpl.mock.calls.length).toBe(MAX_SEARCH_CANDIDATES);
  });

  it('marks partial when some months fail and averages successful months only', async () => {
    const monthsYm = recentMonthsYm(6, 6);
    const failMonth = monthsYm[0];
    if (failMonth === undefined) {
      throw new Error('expected six crime months');
    }
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
      if (url.includes('data.police.uk') && url.includes(`date=${failMonth}`)) {
        return Promise.resolve(new Response('Bad Request', { status: 400 }));
      }
      if (url.includes('data.police.uk')) {
        return Promise.resolve(
          new Response(JSON.stringify([{ category: 'burglary' }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(new Response('{}', { status: 404 }));
    }) as typeof fetch;

    const { areas } = await buildRankedAreas(
      { ...minimalBody, crime: { ...minimalBody.crime, windowMonths: 6 } },
      fetchImpl,
      undefined,
    );
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0]?.metadata?.policeUk).toBe('partial');
    expect(areas[0]?.metadata?.crimeDataAvailable).toBe(1);
    expect(areas[0]?.metadata?.crimeMonthsPartial).toBe(1);
    expect(areas[0]?.metadata?.crimeMonthsUsed).toBe(monthsYm.length - 1);
    expect(areas[0]?.breakdown.crime).not.toBe(CRIME_SCORE_WHEN_POLICE_UNAVAILABLE);
  });

  it('uses conservative crime score when police.uk returns an error', async () => {
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
        return Promise.resolve(new Response('Unavailable', { status: 400 }));
      }
      return Promise.resolve(new Response('{}', { status: 404 }));
    }) as typeof fetch;

    const { areas } = await buildRankedAreas(minimalBody, fetchImpl, undefined);
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0]?.metadata?.policeUk).toBe('error');
    expect(areas[0]?.metadata?.crimeDataAvailable).toBe(0);
    expect(areas[0]?.breakdown.crime).toBe(CRIME_SCORE_WHEN_POLICE_UNAVAILABLE);
  });

  it('computes size fit second score when sizeFit is requested', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ category: 'burglary' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const { areas } = await buildRankedAreas(
      { ...minimalBody, sizeFit: { minFloorAreaM2: 95 } },
      fetchImpl,
      undefined,
    );
    expect(areas[0]?.metadata?.sizeFitModel).toBe('heuristic-inner-outer-london-v1');
    expect(areas[0]?.metadata?.sizeFitUserMinM2).toBe(95);
    expect(areas[0]?.metadata?.sizeFitTypicalM2Coverage).toBe('heuristic-only');
    expect(areas[0]?.metadata?.sizeFitEpcGeneratedAt).toBeUndefined();
    expect(typeof areas[0]?.breakdown.sizeFit).toBe('number');
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

    const { areas } = await buildRankedAreas(body, fetchImpl, {
      tfl: { appKey: 'test-key' },
    });
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0]?.metadata?.commuteModel).toBe('tfl-unified-api');
    expect(areas[0]?.metadata?.commuteJourneyMinutes).toBe(30);
    expect(areas[0]?.metadata?.commuteNetworkRoutingBonusApplied).toBe(25);
  });

  it('uses OpenRouteService for driving when credentials provided', async () => {
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
      if (url.includes('openrouteservice.org')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ routes: [{ summary: { duration: 1200, distance: 3000 } }] }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        );
      }
      return Promise.resolve(new Response('{}', { status: 404 }));
    }) as typeof fetch;

    const { areas } = await buildRankedAreas(minimalBody, fetchImpl, {
      openRouteService: { apiKey: 'ors-test' },
    });
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0]?.metadata?.commuteModel).toBe('openrouteservice-directions');
    expect(areas[0]?.metadata?.commuteJourneyMinutes).toBe(20);
    expect(areas[0]?.metadata?.commuteNetworkRoutingBonusApplied).toBe(25);
  });

  it('uses live UK HPI medians when enabled and Land Registry responds', async () => {
    const requestToUrl = (input: RequestInfo | URL): string => {
      if (typeof input === 'string') {
        return input;
      }
      if (input instanceof URL) {
        return input.href;
      }
      return input.url;
    };

    const sparqlBindings = LONDON_BOROUGH_MEDIANS.map((row) => {
      const slug = ukhpiSlug(row);
      return {
        regionUri: { value: `http://landregistry.data.gov.uk/id/region/${slug}` },
        price: { value: '400000' },
        month: { value: '2025-06' },
      };
    });

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
      if (url.includes('/landregistry/query')) {
        return Promise.resolve(
          new Response(JSON.stringify({ results: { bindings: sparqlBindings } }), {
            status: 200,
            headers: { 'Content-Type': 'application/sparql-results+json' },
          }),
        );
      }
      return Promise.resolve(new Response('{}', { status: 404 }));
    }) as typeof fetch;

    const { areas } = await buildRankedAreas(minimalBody, fetchImpl, {
      useLiveUkhpiMedians: true,
    });
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0]?.metadata?.affordabilityPriceSource).toBe('ukhpi-linked-data');
    expect(areas[0]?.metadata?.ukhpiRefMonth).toBe('2025-06');
    expect(areas[0]?.metadata?.ukhpiPriceMeasure).toBe('averagePriceFlatMaisonette');
    expect(areas[0]?.metadata?.schoolsModel).toBe(
      'gias-open-data-sample-performance-seed-prototype',
    );
    expect(typeof areas[0]?.metadata?.schoolsDataAttribution).toBe('string');
    expect(typeof areas[0]?.metadata?.schoolsPointsWithUrn).toBe('number');
    expect(typeof areas[0]?.metadata?.schoolsPointsMatchedByUrn).toBe('number');
    expect(typeof areas[0]?.metadata?.schoolsPerformanceCoveragePct).toBe('number');
  });
});
