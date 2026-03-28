const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres (WGS84 sphere). */
export const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

/** Initial bearing from (lat1,lng1) to (lat2,lng2) in degrees [0, 360). */
export const bearingDegrees = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

const COMPASS8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export const bearingToCompass8 = (bearingDeg: number): string => {
  const i = Math.round(bearingDeg / 45) % 8;
  return COMPASS8[i] ?? 'N';
};
