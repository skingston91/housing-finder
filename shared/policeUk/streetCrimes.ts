const BASE = 'https://data.police.uk/api';

export interface PoliceStreetCrimeRow {
  readonly category: string;
}

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
      return [];
    }
    if (!res.ok) {
      throw new Error(`police.uk HTTP ${String(res.status)}`);
    }
    const json: unknown = await res.json();
    return parseStreetCrimesResponse(json);
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
