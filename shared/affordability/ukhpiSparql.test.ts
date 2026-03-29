import { describe, expect, it, vi } from 'vitest';

import { UKHPI_REGION_SLUG_BY_BOROUGH_ID } from './ukhpiRegionSlugByBoroughId';
import {
  buildLondonBoroughUkhpiSparqlQuery,
  fetchLondonBoroughUkhpiPricesViaSparql,
  regionSlugFromUkhpiRegionUri,
} from './ukhpiSparql';

describe('regionSlugFromUkhpiRegionUri', () => {
  it('returns last path segment', () => {
    expect(
      regionSlugFromUkhpiRegionUri(
        'http://landregistry.data.gov.uk/id/region/kingston-upon-thames',
      ),
    ).toBe('kingston-upon-thames');
  });
});

describe('buildLondonBoroughUkhpiSparqlQuery', () => {
  it('includes every borough slug once in VALUES', () => {
    const q = buildLondonBoroughUkhpiSparqlQuery();
    for (const slug of new Set(Object.values(UKHPI_REGION_SLUG_BY_BOROUGH_ID))) {
      expect(q).toContain(`<http://landregistry.data.gov.uk/id/region/${slug}>`);
    }
    expect(q).toContain('SELECT ?regionUri ?price ?month');
    expect(q).toContain('ukhpi:averagePrice ?price');
  });

  it('uses property-type-specific predicate when requested', () => {
    const q = buildLondonBoroughUkhpiSparqlQuery('averagePriceFlatMaisonette');
    expect(q).toContain('ukhpi:averagePriceFlatMaisonette ?price');
  });
});

describe('fetchLondonBoroughUkhpiPricesViaSparql', () => {
  it('parses bindings into borough id map', async () => {
    const fetchImpl = vi.fn((): Promise<Response> => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            results: {
              bindings: [
                {
                  regionUri: { value: 'http://landregistry.data.gov.uk/id/region/camden' },
                  price: { value: '794413' },
                  month: { value: '2026-01' },
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }) as typeof fetch;

    const result = await fetchLondonBoroughUkhpiPricesViaSparql(fetchImpl);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.map.get('camden')).toEqual({ averagePriceGbp: 794_413, refMonth: '2026-01' });
    }
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchImpl).mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });
});
