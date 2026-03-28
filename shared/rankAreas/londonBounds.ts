/** Rough axis-aligned bounds for Greater London (phase-1 heuristic, not official geometry). */
export const LONDON_BOUNDS = {
  minLat: 51.28,
  maxLat: 51.7,
  minLng: -0.51,
  maxLng: 0.15,
} as const;

export const pointInLondonBounds = (latitude: number, longitude: number): boolean =>
  latitude >= LONDON_BOUNDS.minLat &&
  latitude <= LONDON_BOUNDS.maxLat &&
  longitude >= LONDON_BOUNDS.minLng &&
  longitude <= LONDON_BOUNDS.maxLng;
