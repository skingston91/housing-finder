const TFL_ORIGIN = 'https://api.tfl.gov.uk';

/** TfL only requires **`app_key`** as a query parameter; do not send `app_id` (deprecated per TfL). */
export interface TflApiCredentials {
  readonly appKey: string;
}

/**
 * Best public-transit journey duration in **minutes** (first “least time” journey), or null if unavailable.
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
