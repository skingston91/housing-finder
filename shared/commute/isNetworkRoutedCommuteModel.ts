/**
 * Journey time came from a **routing API** (TfL Journey Planner or OpenRouteService directions),
 * not from haversine/speed proxies after a failed API call.
 */
export const isNetworkRoutedCommuteModel = (model: string): boolean =>
  model === 'tfl-unified-api' || model === 'openrouteservice-directions';
