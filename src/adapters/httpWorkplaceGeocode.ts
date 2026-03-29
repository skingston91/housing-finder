import { postGeocodeWorkplace } from '@/services/geocodeWorkplaceClient';

import type { WorkplaceGeocodePort } from './ports';

export const createHttpWorkplaceGeocodeAdapter = (
  post: typeof postGeocodeWorkplace,
): WorkplaceGeocodePort => ({
  async geocodeFromLabel(query: string) {
    return post(query);
  },
});

/** Default browser adapter: `/api/geocode-workplace` via `fetch`. */
export const httpWorkplaceGeocodeAdapter: WorkplaceGeocodePort =
  createHttpWorkplaceGeocodeAdapter(postGeocodeWorkplace);
