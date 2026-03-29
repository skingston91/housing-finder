const TFL_ORIGIN = 'https://api.tfl.gov.uk';

/** TfL only requires **`app_key`** as a query parameter; do not send `app_id` (deprecated per TfL). */
export interface TflApiCredentials {
  readonly appKey: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

interface CacheEntry {
  readonly storedAt: number;
  readonly minutes: number | null;
}

const journeyCache = new Map<string, CacheEntry>();

const roundCoord = (n: number): number => Math.round(n * 10_000) / 10_000;

const cacheKey = (fromLat: number, fromLng: number, toLat: number, toLng: number): string =>
  `${String(roundCoord(fromLat))},${String(roundCoord(fromLng))}|${String(roundCoord(toLat))},${String(roundCoord(toLng))}`;

/** Clears the in-memory TfL journey cache (warm Lambda reuse only). For tests. */
export const clearTflJourneyCache = (): void => {
  journeyCache.clear();
};

const fetchTflTransitJourneyMinutesUncached = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: TflApiCredentials,
  timeoutMs = 10_000,
): Promise<number | null> => {
  const u = new URL(TFL_ORIGIN);
  u.pathname = `/Journey/JourneyResults/${String(fromLat)},${String(fromLng)}/to/${String(toLat)},${String(toLng)}`;
  u.searchParams.set('app_key', creds.appKey);
  u.searchParams.set('journeyPreference', 'LeastTime');
  u.searchParams.set('mode', 'tube,bus,dlr,tram,overground,tflrail,elizabeth-line,walking');

  const res = await fetchImpl(u.href, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    return null;
  }

  let json: unknown;
  try {
    json = (await res.json()) as unknown;
  } catch {
    return null;
  }

  if (typeof json !== 'object' || json === null) {
    return null;
  }

  const journeys = (json as { journeys?: unknown }).journeys;
  if (!Array.isArray(journeys) || journeys.length === 0) {
    return null;
  }

  const first: unknown = journeys[0];
  if (typeof first !== 'object' || first === null) {
    return null;
  }

  const durationSec = (first as { duration?: unknown }).duration;
  if (typeof durationSec !== 'number' || !Number.isFinite(durationSec) || durationSec < 0) {
    return null;
  }

  return durationSec / 60;
};

/**
 * Best public-transit journey duration in **minutes** (first “least time” journey), or null if unavailable.
 * Reuses responses across warm Lambda invocations (TTL + capped size; keyed by rounded coordinates).
 * @see https://api.tfl.gov.uk/ — register for an **app key** only.
 */
export const fetchTflTransitJourneyMinutes = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: TflApiCredentials,
  timeoutMs = 10_000,
): Promise<number | null> => {
  const key = cacheKey(fromLat, fromLng, toLat, toLng);
  const now = Date.now();
  const hit = journeyCache.get(key);
  if (hit !== undefined && now - hit.storedAt < CACHE_TTL_MS) {
    journeyCache.delete(key);
    journeyCache.set(key, hit);
    return hit.minutes;
  }

  const minutes = await fetchTflTransitJourneyMinutesUncached(
    fromLat,
    fromLng,
    toLat,
    toLng,
    fetchImpl,
    creds,
    timeoutMs,
  );

  journeyCache.set(key, { storedAt: now, minutes });
  while (journeyCache.size > MAX_CACHE_ENTRIES) {
    const firstKey = journeyCache.keys().next().value;
    if (firstKey === undefined) {
      break;
    }
    journeyCache.delete(firstKey);
  }

  return minutes;
};
