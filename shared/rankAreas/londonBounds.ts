/**
 * Axis-aligned bounds for **South East England** area discovery (heuristic, not official boundaries):
 * Greater London plus commuter-relevant Surrey, Kent, Essex, Sussex, and west Berkshire.
 * Affordability / schools in the rank pipeline still use **nearest London borough** medians as a proxy
 * outside GLA — discovery only.
 */
export const SEARCH_REGION_BOUNDS = {
  minLat: 50.58,
  maxLat: 51.98,
  minLng: -1.18,
  maxLng: 1.42,
} as const;

/** @deprecated Alias for {@link SEARCH_REGION_BOUNDS} — name retained for older imports. */
export const LONDON_BOUNDS = SEARCH_REGION_BOUNDS;

export const pointInSearchRegionBounds = (latitude: number, longitude: number): boolean =>
  latitude >= SEARCH_REGION_BOUNDS.minLat &&
  latitude <= SEARCH_REGION_BOUNDS.maxLat &&
  longitude >= SEARCH_REGION_BOUNDS.minLng &&
  longitude <= SEARCH_REGION_BOUNDS.maxLng;

/** @deprecated Use {@link pointInSearchRegionBounds}. */
export const pointInLondonBounds = pointInSearchRegionBounds;
