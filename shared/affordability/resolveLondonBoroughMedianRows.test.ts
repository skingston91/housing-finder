import { afterEach, describe, expect, it, vi } from 'vitest';

import { LONDON_BOROUGH_MEDIANS } from './londonBoroughMedians';
import {
  clearLondonBoroughMedianCache,
  resolveLondonBoroughMedianRows,
} from './resolveLondonBoroughMedianRows';

describe('resolveLondonBoroughMedianRows', () => {
  afterEach(() => {
    clearLondonBoroughMedianCache();
  });

  it('returns static table when live is false', async () => {
    const fetchImpl = vi.fn() as typeof fetch;
    const r = await resolveLondonBoroughMedianRows(fetchImpl, { live: false });
    expect(r.priceSource).toBe('static-london-borough-table');
    expect(r.rows).toBe(LONDON_BOROUGH_MEDIANS);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('merges UK HPI prices when live and fetch succeeds', async () => {
    const fetchImpl = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes('landregistry.data.gov.uk') && url.includes('_pageSize=1')) {
        const m = /region\/([^/?.]+)\.json/.exec(url);
        const slug = m?.[1] ?? 'x';
        return Promise.resolve(
          new Response(
            JSON.stringify({
              result: {
                items: [`http://landregistry.data.gov.uk/data/ukhpi/region/${slug}/month/2025-06`],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('landregistry.data.gov.uk') && url.includes('/month/')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              result: {
                primaryTopic: { averagePrice: 400_000, refMonth: '2025-06' },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(new Response('{}', { status: 404 }));
    }) as typeof fetch;

    const r = await resolveLondonBoroughMedianRows(fetchImpl, { live: true });
    expect(r.priceSource).toBe('ukhpi-linked-data');
    expect(r.ukhpiRefMonth).toBe('2025-06');
    expect(r.rows.every((row) => row.medianPriceGbp === 400_000)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(LONDON_BOROUGH_MEDIANS.length * 2);
  });
});
