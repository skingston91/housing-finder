/** User constraints for area discovery (MVP: London-first, buy not rent yet). */

export type PropertyType =
  | 'flat'
  | 'terraced'
  | 'semi_detached'
  | 'detached'
  | 'bungalow'
  | 'other';

export interface WorkplaceAnchor {
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
}

export type TransitJourneyPreference = 'least_time' | 'least_interchange' | 'least_walking';

export interface TransitCommutePreferences {
  readonly journeyPreference?: TransitJourneyPreference;
  readonly includeAlternativeRoutes?: boolean;
  readonly avoidLineIds?: readonly string[];
  readonly requireMultipleJourneys?: boolean;
  readonly atMostOneRailLeg?: boolean;
  readonly atMostOnePublicTransportLeg?: boolean;
  readonly dateYyyyMmDd?: string;
  readonly timeHhMm?: string;
  readonly timeIsDeparting?: boolean;
  readonly maxWalkingMinutes?: number;
  readonly maxTransferMinutes?: number;
  readonly omitDefaultPlannerDeparture?: boolean;
}

export interface CommuteConstraints {
  /** Maximum door-to-door or leg time depending on adapter; MVP may use driving only first. */
  readonly maxMinutes: number;
  readonly mode: 'driving' | 'transit' | 'cycling' | 'walking';
  readonly transit?: TransitCommutePreferences;
}

export interface SchoolPreferences {
  readonly phases: readonly ('primary' | 'secondary' | 'sixth_form')[];
  readonly maxWalkOrDriveMinutes?: number;
  /** Future: faith filter, minimum progress / grade band, etc. */
}

export interface CrimePreferences {
  /** Rolling window in months (default 12 in product copy). */
  readonly windowMonths: number;
  /** Category slug → weight; higher = more penalty for incidents in that category. */
  readonly categoryWeights: Readonly<Record<string, number>>;
}

export interface AreaSearchCriteria {
  readonly maxPriceGbp: number;
  readonly maxPricePerM2Gbp?: number;
  readonly propertyTypes: readonly PropertyType[];
  readonly workplace: WorkplaceAnchor;
  readonly commute: CommuteConstraints;
  readonly schools: SchoolPreferences;
  readonly crime: CrimePreferences;
}
