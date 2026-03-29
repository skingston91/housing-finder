/**
 * HTTP contract for POST /api/geocode-workplace (server-side: optional Mapbox, else Nominatim).
 */

export interface GeocodeWorkplaceRequestBody {
  readonly q: string;
}

export interface GeocodeWorkplaceResponseBody {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
  /** Which upstream resolved the query (omitted in older clients). */
  readonly geocodeProvider?: 'mapbox' | 'nominatim';
}
