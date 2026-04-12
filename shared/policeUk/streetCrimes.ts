const BASE = 'https://data.police.uk/api';

/** Monthly crime slices change rarely; reuse successful responses across searches in the same warm Lambda. */
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 4000;

export interface PoliceStreetCrimeRow {
  readonly category: string;
}

interface CacheEntry {
  readonly storedAt: number;
  readonly rows: readonly PoliceStreetCrimeRow[];
}

const streetCrimeCache = new Map<string, CacheEntry>();

const roundCoord = (n: number): number => Math.round(n * 10_000) / 10_000;

const cacheKey = (lat: number, lng: number, dateYm: string): string =>
  `${String(roundCoord(lat))},${String(roundCoord(lng))}|${dateYm}`;

const cloneRows = (rows: readonly PoliceStreetCrimeRow[]): PoliceStreetCrimeRow[] =>
  rows.map((r) => ({ category: r.category }));

const evictOldestIfOverCap = (): void => {
  while (streetCrimeCache.size > MAX_CACHE_ENTRIES) {
    const firstKey = streetCrimeCache.keys().next().value;
    if (firstKey === undefined) {
      break;
    }
    streetCrimeCache.delete(firstKey);
  }
};

/** Clears in-memory police.uk street-crime cache (warm Lambda only). For tests. */
export const clearStreetCrimesCache = (): void => {
  streetCrimeCache.clear();
};

const rememberSuccess = (key: string, rows: readonly PoliceStreetCrimeRow[]): void => {
  const snapshot = cloneRows(rows);
  streetCrimeCache.set(key, { storedAt: Date.now(), rows: snapshot });
  evictOldestIfOverCap();
};

export const buildStreetCrimesUrl = (lat: number, lng: number, dateYm: string): string => {
  const u = new URL(`${BASE}/crimes-street/all-crime`);
  u.searchParams.set('lat', String(lat));
  u.searchParams.set('lng', String(lng));
  u.searchParams.set('date', dateYm);
  return u.href;
};

export const parseStreetCrimesResponse = (data: unknown): PoliceStreetCrimeRow[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  const out: PoliceStreetCrimeRow[] = [];
  for (const item of data) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'category' in item &&
      typeof (item as { category: unknown }).category === 'string'
    ) {
      out.push({ category: (item as { category: string }).category });
    }
  }
  return out;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Same class of transient failures we retry for TfL — police.uk is often overloaded. */
const shouldRetryPoliceHttpStatus = (status: number): boolean =>
  status === 429 || status === 502 || status === 503 || status === 504;

const MAX_POLICE_ATTEMPTS = 5;

export const fetchStreetCrimes = async (
  lat: number,
  lng: number,
  dateYm: string,
  fetchImpl: typeof fetch,
  timeoutMs = 15_000,
): Promise<PoliceStreetCrimeRow[]> => {
  const key = cacheKey(lat, lng, dateYm);
  const now = Date.now();
  const hit = streetCrimeCache.get(key);
  if (hit !== undefined && now - hit.storedAt < CACHE_TTL_MS) {
    streetCrimeCache.delete(key);
    streetCrimeCache.set(key, hit);
    return cloneRows(hit.rows);
  }

  const url = buildStreetCrimesUrl(lat, lng, dateYm);
  const headers: HeadersInit = {
    Accept: 'application/json',
    'User-Agent': 'housing-finder/0.1 (data.police.uk consumer)',
  };

  for (let attempt = 0; attempt < MAX_POLICE_ATTEMPTS; attempt++) {
    const res = await fetchImpl(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (shouldRetryPoliceHttpStatus(res.status)) {
      if (attempt < MAX_POLICE_ATTEMPTS - 1) {
        await sleep(450 * (attempt + 1) + Math.floor(Math.random() * 300));
        continue;
      }
      throw new Error(`police.uk HTTP ${String(res.status)}`);
    }
    if (res.status === 404) {
      rememberSuccess(key, []);
      return [];
    }
    if (!res.ok) {
      throw new Error(`police.uk HTTP ${String(res.status)}`);
    }
    const json: unknown = await res.json();
    const parsed = parseStreetCrimesResponse(json);
    rememberSuccess(key, parsed);
    return parsed;
  }
  throw new Error('police.uk: retries exhausted');
};

/** Sum weights for each incident; categories not in the map use defaultWeight (usually 1). */
export const sumWeightedCrimeCount = (
  crimes: readonly PoliceStreetCrimeRow[],
  categoryWeights: Readonly<Record<string, number>>,
  defaultWeight = 1,
): number => {
  let sum = 0;
  for (const c of crimes) {
    const w = categoryWeights[c.category];
    sum += typeof w === 'number' && Number.isFinite(w) ? w : defaultWeight;
  }
  return sum;
};
