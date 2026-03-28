/**
 * HTTP contract for POST /api/geocode-workplace (Nominatim-backed, server-side only).
 */

export interface GeocodeWorkplaceRequestBody {
  readonly q: string;
}

export interface GeocodeWorkplaceResponseBody {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
}
