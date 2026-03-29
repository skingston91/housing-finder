import type { PropertyTypeDto } from '../searchAreasContract';

import type { LondonBoroughMedianRow } from './londonBoroughMedians';
import { LONDON_BOROUGH_MEDIANS } from './londonBoroughMedians';
import type { UkhpiAveragePriceKey } from './ukhpiAveragePriceKey';
import { ukhpiAveragePriceKeyForPropertyTypes } from './ukhpiAveragePriceKey';
import { fetchLatestAveragePriceForUkhpiSlug } from './ukhpiLinkedDataApi';
import { fetchLondonBoroughUkhpiPricesViaSparql } from './ukhpiSparql';
import { UKHPI_REGION_SLUG_BY_BOROUGH_ID } from './ukhpiRegionSlugByBoroughId';

export type AffordabilityMedianPriceSource =
  | 'ukhpi-linked-data'
  | 'ukhpi-partial-static-fallback'
  | 'static-london-borough-table';

export interface ResolvedLondonBoroughMedianRows {
  readonly rows: readonly LondonBoroughMedianRow[];
  readonly priceSource: AffordabilityMedianPriceSource;
  /** Latest UK HPI `refMonth` when all boroughs resolved from live data (YYYY-MM). */
  readonly ukhpiRefMonth?: string;
  /** Which UK HPI average-price field was used (single property type vs all dwellings). */
  readonly ukhpiPriceMeasure?: UkhpiAveragePriceKey;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const cache = new Map<
  string,
  { readonly expiresAt: number; readonly payload: ResolvedLondonBoroughMedianRows }
>();

export const clearLondonBoroughMedianCache = (): void => {
  cache.clear();
};

const maxRefMonth = (a: string, b: string): string => (a > b ? a : b);

const mapInBatches = async <T, R>(
  items: readonly T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
};

/**
 * Optionally refreshes borough benchmark prices from HM Land Registry **UK HPI**.
 * One **SPARQL** request per `ukhpiPriceMeasure` cache key, then JSON GETs for gaps.
 * Cached **6 hours** per Lambda instance per measure. On total failure, returns static table only.
 */
export const resolveLondonBoroughMedianRows = async (
  fetchImpl: typeof fetch,
  options: { readonly live: boolean; readonly propertyTypes: readonly PropertyTypeDto[] },
): Promise<ResolvedLondonBoroughMedianRows> => {
  if (!options.live) {
    return {
      rows: LONDON_BOROUGH_MEDIANS,
      priceSource: 'static-london-borough-table',
    };
  }

  const priceKey = ukhpiAveragePriceKeyForPropertyTypes(options.propertyTypes);
  const now = Date.now();
  const cached = cache.get(priceKey);
  if (cached !== undefined && now < cached.expiresAt) {
    return cached.payload;
  }

  const merged: LondonBoroughMedianRow[] = LONDON_BOROUGH_MEDIANS.map((row) => ({ ...row }));
  let successCount = 0;
  let failCount = 0;
  let refMonthMax: string | undefined;

  const applyPrice = (boroughId: string, priceGbp: number, refMonth: string): boolean => {
    const idx = merged.findIndex((x) => x.id === boroughId);
    if (idx === -1) {
      return false;
    }
    const row = merged[idx];
    if (row === undefined) {
      return false;
    }
    successCount += 1;
    merged[idx] = { ...row, medianPriceGbp: priceGbp };
    refMonthMax = refMonthMax === undefined ? refMonth : maxRefMonth(refMonthMax, refMonth);
    return true;
  };

  const sparqlMap = await fetchLondonBoroughUkhpiPricesViaSparql(fetchImpl, priceKey);
  const resolvedFromSparql = new Set<string>();
  if (sparqlMap !== null) {
    for (const [boroughId, live] of sparqlMap) {
      if (applyPrice(boroughId, live.averagePriceGbp, live.refMonth)) {
        resolvedFromSparql.add(boroughId);
      }
    }
  }

  const needJsonFetch = LONDON_BOROUGH_MEDIANS.filter((row) => !resolvedFromSparql.has(row.id));

  const jsonResults = await mapInBatches(needJsonFetch, 8, async (row) => {
    const slug = UKHPI_REGION_SLUG_BY_BOROUGH_ID[row.id];
    if (slug === undefined) {
      return { id: row.id, live: null };
    }
    const live = await fetchLatestAveragePriceForUkhpiSlug(slug, fetchImpl, priceKey);
    return { id: row.id, live };
  });

  for (const r of jsonResults) {
    if (r.live === null) {
      failCount += 1;
      continue;
    }
    void applyPrice(r.id, r.live.averagePriceGbp, r.live.refMonth);
  }

  let priceSource: AffordabilityMedianPriceSource;
  if (successCount === 0) {
    priceSource = 'static-london-borough-table';
  } else if (failCount > 0 || successCount < LONDON_BOROUGH_MEDIANS.length) {
    priceSource = 'ukhpi-partial-static-fallback';
  } else {
    priceSource = 'ukhpi-linked-data';
  }

  const payload: ResolvedLondonBoroughMedianRows =
    successCount === 0
      ? { rows: LONDON_BOROUGH_MEDIANS, priceSource: 'static-london-borough-table' }
      : {
          rows: merged,
          priceSource,
          ukhpiPriceMeasure: priceKey,
          ...(refMonthMax !== undefined ? { ukhpiRefMonth: refMonthMax } : {}),
        };

  if (successCount > 0) {
    cache.set(priceKey, { expiresAt: now + CACHE_TTL_MS, payload });
  }
  return payload;
};
