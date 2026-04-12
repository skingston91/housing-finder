import type { LondonBoroughMedianRow } from '../affordability/londonBoroughMedians';
import { nearestBoroughMedianFromRows } from '../affordability/nearestBoroughMedian';
import { SOUTH_EAST_COMMUTER_MEDIAN_ANCHORS } from '../affordability/southEastCommuterMedianAnchors';

import { LONDON_AREA_CANDIDATES } from './candidates';
import { haversineKm } from './geo';

export interface MapLabelPoint {
  readonly displayName: string;
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Extra named centroids so grid headers read like map labels (neighbourhood-scale),
 * not only London boroughs. Distinct from `LONDON_AREA_CANDIDATES` search seeds — this
 * list is for **labelling** only.
 */
const INNER_AND_OUTER_LONDON_LABEL_SEEDS: readonly MapLabelPoint[] = [
  { displayName: 'Shoreditch', latitude: 51.5238, longitude: -0.0758 },
  { displayName: 'Hoxton', latitude: 51.5314, longitude: -0.0755 },
  { displayName: 'Spitalfields', latitude: 51.5194, longitude: -0.0745 },
  { displayName: 'Whitechapel', latitude: 51.5195, longitude: -0.0598 },
  { displayName: 'Stepney', latitude: 51.5156, longitude: -0.0462 },
  { displayName: 'Mile End', latitude: 51.5249, longitude: -0.0334 },
  { displayName: 'Bow', latitude: 51.5279, longitude: -0.0249 },
  { displayName: 'Victoria Park', latitude: 51.5367, longitude: -0.0394 },
  { displayName: 'Dalston', latitude: 51.5485, longitude: -0.0757 },
  { displayName: 'Stoke Newington', latitude: 51.5615, longitude: -0.0825 },
  { displayName: 'Finsbury Park', latitude: 51.5642, longitude: -0.1058 },
  { displayName: 'Highbury', latitude: 51.5526, longitude: -0.0975 },
  { displayName: 'Angel', latitude: 51.5328, longitude: -0.1057 },
  { displayName: 'Clerkenwell', latitude: 51.5223, longitude: -0.1044 },
  { displayName: 'St Paul’s', latitude: 51.5147, longitude: -0.0987 },
  { displayName: 'Liverpool Street', latitude: 51.5174, longitude: -0.0823 },
  { displayName: 'Canary Wharf', latitude: 51.5054, longitude: -0.0235 },
  { displayName: 'Deptford', latitude: 51.4749, longitude: -0.0276 },
  { displayName: 'New Cross', latitude: 51.4756, longitude: -0.0374 },
  { displayName: 'Bermondsey', latitude: 51.4975, longitude: -0.0815 },
  { displayName: 'Borough', latitude: 51.5028, longitude: -0.0914 },
  { displayName: 'Elephant and Castle', latitude: 51.4946, longitude: -0.0999 },
  { displayName: 'Brixton', latitude: 51.4613, longitude: -0.1146 },
  { displayName: 'Herne Hill', latitude: 51.4534, longitude: -0.1003 },
  { displayName: 'Putney', latitude: 51.4618, longitude: -0.2165 },
  { displayName: 'Hammersmith', latitude: 51.4926, longitude: -0.2245 },
  { displayName: 'Ealing Broadway', latitude: 51.5152, longitude: -0.3008 },
  { displayName: 'Wembley', latitude: 51.556, longitude: -0.2795 },
  { displayName: 'Wimbledon', latitude: 51.4214, longitude: -0.2068 },
  { displayName: 'Richmond', latitude: 51.4613, longitude: -0.3058 },
  { displayName: 'Kingston upon Thames', latitude: 51.4085, longitude: -0.3064 },
  { displayName: 'Croydon', latitude: 51.3762, longitude: -0.0982 },
  { displayName: 'Crystal Palace', latitude: 51.4181, longitude: -0.0726 },
  { displayName: 'Woolwich', latitude: 51.4892, longitude: 0.0648 },
];

/** Town-centre labels outside the GLA (same centroids as affordability anchors). */
const SOUTH_EAST_COMMUTER_LABEL_SEEDS: readonly MapLabelPoint[] =
  SOUTH_EAST_COMMUTER_MEDIAN_ANCHORS.map((a) => ({
    displayName: a.boroughName,
    latitude: a.latitude,
    longitude: a.longitude,
  }));

const MAP_LABEL_POINTS: readonly MapLabelPoint[] = [
  ...LONDON_AREA_CANDIDATES.map((c) => ({
    displayName: c.displayName,
    latitude: c.latitude,
    longitude: c.longitude,
  })),
  ...INNER_AND_OUTER_LONDON_LABEL_SEEDS,
  ...SOUTH_EAST_COMMUTER_LABEL_SEEDS,
];

/** Within this radius, use the **nearest seed place name**; otherwise use the nearest borough label. */
const DEFAULT_MAX_SEED_KM = 5;

/**
 * Human-readable place for result headers: neighbourhood / landmark when a seed is close enough,
 * else borough (same proximity rule as affordability).
 */
export const nearestMapAreaDisplayName = (
  latitude: number,
  longitude: number,
  medianRows: readonly LondonBoroughMedianRow[],
  maxSeedKm: number = DEFAULT_MAX_SEED_KM,
): string => {
  let best: MapLabelPoint | null = null;
  let bestKm = Infinity;
  for (const p of MAP_LABEL_POINTS) {
    const km = haversineKm(latitude, longitude, p.latitude, p.longitude);
    if (km < bestKm) {
      bestKm = km;
      best = p;
    }
  }
  if (best !== null && bestKm <= maxSeedKm) {
    return best.displayName;
  }
  return nearestBoroughMedianFromRows(latitude, longitude, medianRows).boroughName;
};
