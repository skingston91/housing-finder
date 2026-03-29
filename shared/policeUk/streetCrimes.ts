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

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetchImpl(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 429) {
      if (attempt < 2) {
        await sleep(400 * (attempt + 1) + Math.floor(Math.random() * 250));
        continue;
      }
      throw new Error('police.uk HTTP 429');
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
