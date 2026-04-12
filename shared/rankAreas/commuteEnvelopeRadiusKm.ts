import type { CommuteModeDto } from '../searchAreasContract';

/**
 * Crow-flies **envelope** radius (km) for seeding search candidates — not an isochrone.
 * Generous vs straight-line distance so **outer SE** (Sussex coast, north Essex, west Berks) can appear
 * when max minutes is high; scoring still uses TfL/ORS or straight-line penalties.
 */
export const commuteEnvelopeRadiusKm = (maxMinutes: number, mode: CommuteModeDto): number => {
  if (!Number.isFinite(maxMinutes) || maxMinutes < 1) {
    return 10;
  }
  const m = Math.min(24 * 60, Math.max(1, maxMinutes));
  switch (mode) {
    case 'transit':
      return Math.min(110, Math.max(10, m * 1.02));
    case 'driving':
      return Math.min(130, Math.max(10, m * 0.95));
    case 'cycling':
      return Math.min(45, Math.max(5, m * 0.45));
    case 'walking':
      return Math.min(12, Math.max(0.8, m * 0.11));
    default:
      return Math.min(110, Math.max(10, m * 1.02));
  }
};
