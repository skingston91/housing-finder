import type { LondonBoroughMedianRow } from './londonBoroughMedians';
import { LONDON_BOROUGH_MEDIANS } from './londonBoroughMedians';
import { fetchLatestAveragePriceForUkhpiSlug } from './ukhpiLinkedDataApi';
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
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

let cache:
  | {
      readonly expiresAt: number;
      readonly payload: ResolvedLondonBoroughMedianRows;
    }
  | undefined;

export const clearLondonBoroughMedianCache = (): void => {
  cache = undefined;
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
 * Optionally refreshes borough **median price** fields from HM Land Registry **UK HPI** linked-data
 * JSON (latest published month per borough). Names and centroids stay on the static London table.
 * Cached **6 hours** per Lambda instance. On total failure, returns static table only.
 */
export const resolveLondonBoroughMedianRows = async (
  fetchImpl: typeof fetch,
  options: { readonly live: boolean },
): Promise<ResolvedLondonBoroughMedianRows> => {
  if (!options.live) {
    return {
      rows: LONDON_BOROUGH_MEDIANS,
      priceSource: 'static-london-borough-table',
    };
  }

  const now = Date.now();
  if (cache !== undefined && now < cache.expiresAt) {
    return cache.payload;
  }

  const results = await mapInBatches(LONDON_BOROUGH_MEDIANS, 8, async (row) => {
    const slug = UKHPI_REGION_SLUG_BY_BOROUGH_ID[row.id];
    if (slug === undefined) {
      return { id: row.id, live: null };
    }
    const live = await fetchLatestAveragePriceForUkhpiSlug(slug, fetchImpl);
    return { id: row.id, live };
  });

  let successCount = 0;
  let failCount = 0;
  let refMonthMax: string | undefined;
  const merged: LondonBoroughMedianRow[] = LONDON_BOROUGH_MEDIANS.map((row) => ({ ...row }));

  for (const r of results) {
    if (r.live === null) {
      failCount += 1;
      continue;
    }
    const idx = merged.findIndex((x) => x.id === r.id);
    if (idx === -1) {
      continue;
    }
    successCount += 1;
    const row = merged[idx];
    if (row === undefined) {
      continue;
    }
    merged[idx] = {
      ...row,
      medianPriceGbp: r.live.averagePriceGbp,
    };
    refMonthMax =
      refMonthMax === undefined ? r.live.refMonth : maxRefMonth(refMonthMax, r.live.refMonth);
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
          ...(refMonthMax !== undefined ? { ukhpiRefMonth: refMonthMax } : {}),
        };

  if (successCount > 0) {
    cache = { expiresAt: now + CACHE_TTL_MS, payload };
  }
  return payload;
};
