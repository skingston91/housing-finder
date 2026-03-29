import { describe, expect, it, vi } from 'vitest';

import {
  fetchLatestAveragePriceForUkhpiSlug,
  parseLatestMonthUriFromRegionList,
  parseMonthObservation,
} from './ukhpiLinkedDataApi';

describe('parseLatestMonthUriFromRegionList', () => {
  it('reads first item URI', () => {
    expect(
      parseLatestMonthUriFromRegionList({
        result: {
          items: ['http://landregistry.data.gov.uk/data/ukhpi/region/camden/month/2025-06'],
        },
      }),
    ).toBe('http://landregistry.data.gov.uk/data/ukhpi/region/camden/month/2025-06');
  });

  it('returns null when empty', () => {
    expect(parseLatestMonthUriFromRegionList({ result: { items: [] } })).toBeNull();
  });
});

describe('parseMonthObservation', () => {
  it('reads average price and month', () => {
    expect(
      parseMonthObservation({
        result: {
          primaryTopic: { averagePrice: 500_123, refMonth: '2025-06' },
        },
      }),
    ).toEqual({ averagePriceGbp: 500_123, refMonth: '2025-06' });
  });

  it('reads flat/maisonette field with fallback to all-dwellings average', () => {
    expect(
      parseMonthObservation(
        {
          result: {
            primaryTopic: { averagePrice: 900_000, refMonth: '2025-06' },
          },
        },
        'averagePriceFlatMaisonette',
      ),
    ).toEqual({ averagePriceGbp: 900_000, refMonth: '2025-06' });
    expect(
      parseMonthObservation(
        {
          result: {
            primaryTopic: {
              averagePriceFlatMaisonette: 650_000,
              averagePrice: 900_000,
              refMonth: '2025-06',
            },
          },
        },
        'averagePriceFlatMaisonette',
      ),
    ).toEqual({ averagePriceGbp: 650_000, refMonth: '2025-06' });
  });
});

describe('fetchLatestAveragePriceForUkhpiSlug', () => {
  it('chains list then observation requests', async () => {
    const fetchImpl = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes('camden.json?_pageSize=1')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              result: {
                items: ['http://landregistry.data.gov.uk/data/ukhpi/region/camden/month/2025-06'],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('/month/2025-06.json')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              result: {
                primaryTopic: { averagePrice: 600_000, refMonth: '2025-06' },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(new Response('not found', { status: 404 }));
    }) as typeof fetch;

    const out = await fetchLatestAveragePriceForUkhpiSlug('camden', fetchImpl);
    expect(out).toEqual({ averagePriceGbp: 600_000, refMonth: '2025-06' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
