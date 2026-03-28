const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

/** Per Nominatim usage policy: identify the application. */
const USER_AGENT =
  'housing-finder/0.1 (local development; https://operations.osmfoundation.org/policies/nominatim/)';

export interface NominatimHit {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
}

const parseHit = (item: unknown): NominatimHit | null => {
  if (typeof item !== 'object' || item === null) {
    return null;
  }
  const latRaw = (item as { lat?: unknown }).lat;
  const lonRaw = (item as { lon?: unknown }).lon;
  const nameRaw = (item as { display_name?: unknown }).display_name;
  if (typeof latRaw !== 'string' || typeof lonRaw !== 'string' || typeof nameRaw !== 'string') {
    return null;
  }
  const latitude = Number(latRaw);
  const longitude = Number(lonRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude, displayName: nameRaw };
};

/**
 * Forward geocode (UK-biased). Returns null when there are no results.
 * Call only from serverless with conservative rate limits (Nominatim policy).
 */
export const geocodeWithNominatim = async (
  query: string,
  fetchImpl: typeof fetch,
  timeoutMs = 12_000,
): Promise<NominatimHit | null> => {
  const u = new URL(NOMINATIM_SEARCH);
  u.searchParams.set('q', query);
  u.searchParams.set('format', 'json');
  u.searchParams.set('limit', '1');
  u.searchParams.set('countrycodes', 'gb');

  const res = await fetchImpl(u.href, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${String(res.status)}`);
  }

  const json: unknown = await res.json();
  if (!Array.isArray(json) || json.length === 0) {
    return null;
  }
  return parseHit(json[0]);
};
