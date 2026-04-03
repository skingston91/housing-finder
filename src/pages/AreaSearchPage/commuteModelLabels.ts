/** User-facing labels for `metadata.commuteModel` (shared contract ids). */
export const commuteModelDisplayLabel = (model: string): string => {
  switch (model) {
    case 'tfl-unified-api':
      return 'TfL journey planner (transit)';
    case 'tfl-fallback-straight-line':
      return 'Straight-line estimate (TfL had no usable journey)';
    case 'openrouteservice-directions':
      return 'OpenRouteService (drive / cycle / walk)';
    case 'openrouteservice-fallback-straight-line':
      return 'Straight-line estimate (no ORS route)';
    case 'straight-line-time-estimate':
      return 'Straight-line time estimate (no routing API)';
    default:
      return model;
  }
};
