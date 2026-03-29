import { geocodeWithMapbox } from './mapboxGeocode';
import { geocodeWithNominatim } from './nominatim';

export type GeocodeProviderId = 'mapbox' | 'nominatim';

export interface GeocodeUkWorkplaceHit {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
  readonly provider: GeocodeProviderId;
}

export interface GeocodeUkWorkplaceOptions {
  /** When non-empty, Mapbox is tried first; on failure or no hit, Nominatim is used. */
  readonly mapboxAccessToken?: string;
}

/**
 * UK-biased workplace forward geocode: optional Mapbox, then Nominatim.
 */
export const geocodeUkWorkplace = async (
  query: string,
  fetchImpl: typeof fetch,
  options?: GeocodeUkWorkplaceOptions,
): Promise<GeocodeUkWorkplaceHit | null> => {
  const token = options?.mapboxAccessToken?.trim();
  if (token) {
    try {
      const mapboxHit = await geocodeWithMapbox(query, fetchImpl, token);
      if (mapboxHit) {
        return { ...mapboxHit, provider: 'mapbox' };
      }
    } catch {
      // fall through to Nominatim
    }
  }

  const nominatimHit = await geocodeWithNominatim(query, fetchImpl);
  if (!nominatimHit) {
    return null;
  }
  return {
    latitude: nominatimHit.latitude,
    longitude: nominatimHit.longitude,
    displayName: nominatimHit.displayName,
    provider: 'nominatim',
  };
};
