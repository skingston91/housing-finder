const MAPBOX_GEOCODE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export interface MapboxGeocodeHit {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
}

const parseFeature = (item: unknown): MapboxGeocodeHit | null => {
  if (typeof item !== 'object' || item === null) {
    return null;
  }
  const center = (item as { center?: unknown }).center;
  if (!Array.isArray(center) || center.length < 2) {
    return null;
  }
  const lng = Number(center[0]);
  const lat = Number(center[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const nameRaw = (item as { place_name?: unknown }).place_name;
  if (typeof nameRaw !== 'string' || nameRaw.length === 0) {
    return null;
  }
  return { latitude: lat, longitude: lng, displayName: nameRaw };
};

/**
 * Forward geocode (UK-biased via `country=gb`). Returns null when there are no features.
 * @see https://docs.mapbox.com/api/search/geocoding/
 */
export const geocodeWithMapbox = async (
  query: string,
  fetchImpl: typeof fetch,
  accessToken: string,
  timeoutMs = 12_000,
): Promise<MapboxGeocodeHit | null> => {
  const path = `${MAPBOX_GEOCODE}/${encodeURIComponent(query)}.json`;
  const u = new URL(path);
  u.searchParams.set('access_token', accessToken);
  u.searchParams.set('country', 'gb');
  u.searchParams.set('limit', '1');

  const res = await fetchImpl(u.href, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    throw new Error(`Mapbox geocode HTTP ${String(res.status)}`);
  }

  const json: unknown = await res.json();
  if (typeof json !== 'object' || json === null) {
    return null;
  }
  const features = (json as { features?: unknown }).features;
  if (!Array.isArray(features) || features.length === 0) {
    return null;
  }
  return parseFeature(features[0]);
};
