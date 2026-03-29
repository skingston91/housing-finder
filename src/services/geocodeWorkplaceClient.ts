import type { GeocodeWorkplaceResponseBody } from '@shared/geocodeContract';

const parseJson = async (res: Response): Promise<unknown> => {
  try {
    return (await res.json()) as unknown;
  } catch {
    return {};
  }
};

export const postGeocodeWorkplace = async (q: string): Promise<GeocodeWorkplaceResponseBody> => {
  const res = await fetch('/api/geocode-workplace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q }),
  });
  const data: unknown = await parseJson(res);
  if (!res.ok) {
    const msg =
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Geocode failed (${String(res.status)})`;
    throw new Error(msg);
  }
  const lat = (data as { latitude?: unknown }).latitude;
  const lng = (data as { longitude?: unknown }).longitude;
  const displayName = (data as { displayName?: unknown }).displayName;
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    typeof displayName !== 'string' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    throw new Error('Invalid geocode response');
  }
  const providerRaw = (data as { geocodeProvider?: unknown }).geocodeProvider;
  const geocodeProvider =
    providerRaw === 'mapbox' || providerRaw === 'nominatim' ? providerRaw : undefined;
  return {
    latitude: lat,
    longitude: lng,
    displayName,
    ...(geocodeProvider ? { geocodeProvider } : {}),
  };
};
