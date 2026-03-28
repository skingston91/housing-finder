/** Named London-ish centroids for phase-1 area discovery (no postcode geometry yet). */
export const LONDON_AREA_CANDIDATES: readonly {
  readonly id: string;
  readonly displayName: string;
  readonly latitude: number;
  readonly longitude: number;
}[] = [
  { id: 'camden-town', displayName: 'Camden Town', latitude: 51.539, longitude: -0.1426 },
  { id: 'islington', displayName: 'Islington', latitude: 51.538, longitude: -0.1023 },
  { id: 'hackney-central', displayName: 'Hackney Central', latitude: 51.547, longitude: -0.0553 },
  { id: 'walthamstow', displayName: 'Walthamstow', latitude: 51.584, longitude: -0.0215 },
  { id: 'leytonstone', displayName: 'Leytonstone', latitude: 51.568, longitude: 0.0082 },
  { id: 'stratford', displayName: 'Stratford', latitude: 51.541, longitude: -0.0034 },
  { id: 'bethnal-green', displayName: 'Bethnal Green', latitude: 51.527, longitude: -0.0553 },
  { id: 'clapham', displayName: 'Clapham', latitude: 51.462, longitude: -0.138 },
  { id: 'peckham', displayName: 'Peckham', latitude: 51.474, longitude: -0.0695 },
  { id: 'greenwich', displayName: 'Greenwich', latitude: 51.482, longitude: -0.0077 },
];
