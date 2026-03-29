import type { UkhpiAveragePriceKey } from './ukhpiAveragePriceKey';

const UKHPI_BASE = 'https://landregistry.data.gov.uk';

const readUkhpiPriceFromTopic = (
  t: Record<string, unknown>,
  priceKey: UkhpiAveragePriceKey,
): number | null => {
  const tryKey = (k: string): number | null => {
    const v = t[k];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      return Math.round(v);
    }
    return null;
  };
  const primary = tryKey(priceKey);
  if (primary !== null) {
    return primary;
  }
  if (priceKey !== 'averagePrice') {
    return tryKey('averagePrice');
  }
  return null;
};

const toHttpsJsonUrl = (linkedDataUri: string): string => {
  const u = linkedDataUri.startsWith('http:')
    ? `https:${linkedDataUri.slice('http:'.length)}`
    : linkedDataUri;
  return u.endsWith('.json') ? u : `${u}.json`;
};

const readResultRecord = (json: unknown): Record<string, unknown> | null => {
  if (typeof json !== 'object' || json === null) {
    return null;
  }
  const root = json as Record<string, unknown>;
  const result = root.result;
  if (typeof result !== 'object' || result === null) {
    return null;
  }
  return result as Record<string, unknown>;
};

/** First month observation URI from a region list page (`…/region/{slug}.json`). */
export const parseLatestMonthUriFromRegionList = (json: unknown): string | null => {
  const result = readResultRecord(json);
  if (result === null) {
    return null;
  }
  const items = result.items;
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  const first: unknown = items[0];
  return typeof first === 'string' && first.length > 0 ? first : null;
};

/** Average price and reporting month from a single observation (`…/month/YYYY-MM.json`). */
export const parseMonthObservation = (
  json: unknown,
  priceKey: UkhpiAveragePriceKey = 'averagePrice',
): { readonly averagePriceGbp: number; readonly refMonth: string } | null => {
  const result = readResultRecord(json);
  if (result === null) {
    return null;
  }
  const topic = result.primaryTopic;
  if (typeof topic !== 'object' || topic === null) {
    return null;
  }
  const t = topic as Record<string, unknown>;
  const price = readUkhpiPriceFromTopic(t, priceKey);
  const refMonth = t.refMonth;
  if (price === null) {
    return null;
  }
  if (typeof refMonth !== 'string' || refMonth.length < 7) {
    return null;
  }
  return { averagePriceGbp: price, refMonth };
};

export const fetchLatestAveragePriceForUkhpiSlug = async (
  slug: string,
  fetchImpl: typeof fetch,
  priceKey: UkhpiAveragePriceKey = 'averagePrice',
): Promise<{ readonly averagePriceGbp: number; readonly refMonth: string } | null> => {
  const listUrl = `${UKHPI_BASE}/data/ukhpi/region/${encodeURIComponent(slug)}.json?_pageSize=1`;
  const listRes = await fetchImpl(listUrl, { headers: { Accept: 'application/json' } });
  if (!listRes.ok) {
    return null;
  }
  let listJson: unknown;
  try {
    listJson = (await listRes.json()) as unknown;
  } catch {
    return null;
  }
  const monthUri = parseLatestMonthUriFromRegionList(listJson);
  if (monthUri === null) {
    return null;
  }
  const obsUrl = toHttpsJsonUrl(monthUri);
  const obsRes = await fetchImpl(obsUrl, { headers: { Accept: 'application/json' } });
  if (!obsRes.ok) {
    return null;
  }
  let obsJson: unknown;
  try {
    obsJson = (await obsRes.json()) as unknown;
  } catch {
    return null;
  }
  return parseMonthObservation(obsJson, priceKey);
};
