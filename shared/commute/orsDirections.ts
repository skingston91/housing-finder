import type { CommuteModeDto } from '../searchAreasContract';

const ORS_DIRECTIONS = 'https://api.openrouteservice.org/v2/directions';

export interface OrsApiCredentials {
  readonly apiKey: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

interface CacheEntry {
  readonly storedAt: number;
  readonly minutes: number | null;
}

const routeCache = new Map<string, CacheEntry>();

const roundCoord = (n: number): number => Math.round(n * 10_000) / 10_000;

const orsProfile = (mode: CommuteModeDto): string | null => {
  switch (mode) {
    case 'driving':
      return 'driving-car';
    case 'cycling':
      return 'cycling-regular';
    case 'walking':
      return 'foot-walking';
    default:
      return null;
  }
};

const cacheKey = (
  profile: string,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): string =>
  `ors:${profile}|${String(roundCoord(fromLat))},${String(roundCoord(fromLng))}|${String(roundCoord(toLat))},${String(roundCoord(toLng))}`;

/** Clears in-memory ORS route cache (warm Lambda only). For tests. */
export const clearOrsDirectionsCache = (): void => {
  routeCache.clear();
};

const parseDurationMinutes = (json: unknown): number | null => {
  if (typeof json !== 'object' || json === null) {
    return null;
  }
  const routes = (json as { routes?: unknown }).routes;
  if (!Array.isArray(routes) || routes.length === 0) {
    return null;
  }
  const firstUnknown: unknown = routes[0];
  if (typeof firstUnknown !== 'object' || firstUnknown === null) {
    return null;
  }
  const summary = (firstUnknown as { summary?: unknown }).summary;
  if (typeof summary !== 'object' || summary === null) {
    return null;
  }
  const durationSec = (summary as { duration?: unknown }).duration;
  if (typeof durationSec !== 'number' || !Number.isFinite(durationSec) || durationSec < 0) {
    return null;
  }
  return durationSec / 60;
};

const fetchOrsDurationMinutesUncached = async (
  profile: string,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: OrsApiCredentials,
  timeoutMs = 12_000,
): Promise<number | null> => {
  const url = `${ORS_DIRECTIONS}/${profile}/json`;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: creds.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      coordinates: [
        [fromLng, fromLat],
        [toLng, toLat],
      ],
    }),
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

  return parseDurationMinutes(json);
};

/**
 * Road/path duration in **minutes** (ORS “fastest” route), or null if unavailable.
 * Cached per warm Lambda (TTL + cap; key includes profile + rounded coordinates).
 * @see https://openrouteservice.org/dev/#/api-docs/v2/directions/{profile}/post
 */
export const fetchOrsRouteDurationMinutes = async (
  mode: CommuteModeDto,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: OrsApiCredentials,
  timeoutMs = 12_000,
): Promise<number | null> => {
  const profile = orsProfile(mode);
  if (profile === null) {
    return null;
  }

  const key = cacheKey(profile, fromLat, fromLng, toLat, toLng);
  const now = Date.now();
  const hit = routeCache.get(key);
  if (hit !== undefined && now - hit.storedAt < CACHE_TTL_MS) {
    routeCache.delete(key);
    routeCache.set(key, hit);
    return hit.minutes;
  }

  const minutes = await fetchOrsDurationMinutesUncached(
    profile,
    fromLat,
    fromLng,
    toLat,
    toLng,
    fetchImpl,
    creds,
    timeoutMs,
  );

  routeCache.set(key, { storedAt: now, minutes });
  while (routeCache.size > MAX_CACHE_ENTRIES) {
    const firstKey = routeCache.keys().next().value;
    if (firstKey === undefined) {
      break;
    }
    routeCache.delete(firstKey);
  }

  return minutes;
};
