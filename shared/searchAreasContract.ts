/**
 * HTTP contract for POST /api/search-areas.
 * Shared between the Vite client and Lambda handlers (no imports from `src/` in `lambda/`).
 */

export type PropertyTypeDto =
  | 'flat'
  | 'terraced'
  | 'semi_detached'
  | 'detached'
  | 'bungalow'
  | 'other';

export type CommuteModeDto = 'driving' | 'transit' | 'cycling' | 'walking';

export type TransitJourneyPreferenceDto = 'least_time' | 'least_interchange' | 'least_walking';

/** Optional TfL Journey Planner tuning when `commute.mode` is `transit`. */
export interface TransitCommutePreferencesDto {
  readonly journeyPreference?: TransitJourneyPreferenceDto;
  readonly includeAlternativeRoutes?: boolean;
  /** TfL line ids to avoid (e.g. `victoria`). Case-insensitive. */
  readonly avoidLineIds?: readonly string[];
  /** Require at least two acceptable journeys (enable `includeAlternativeRoutes` for best results). */
  readonly requireMultipleJourneys?: boolean;
  /** Prefer at most one tube/train-style leg (still allows bus and walking). */
  readonly atMostOneRailLeg?: boolean;
  /** At most one non-walking leg (one bus/tube/train segment; walking links still allowed). */
  readonly atMostOnePublicTransportLeg?: boolean;
  /** TfL planner date **yyyyMMdd**; send with {@link timeHhMm}. */
  readonly dateYyyyMmDd?: string;
  /** TfL planner time **HHmm** (24h); send with {@link dateYyyyMmDd}. */
  readonly timeHhMm?: string;
  /** When **time** is set: `true` = depart at that time, `false` = arrive by that time. Default **true**. */
  readonly timeIsDeparting?: boolean;
  /** TfL `maxWalkingMinutes` cap for the journey. */
  readonly maxWalkingMinutes?: number;
  /** TfL `maxTransferMinutes` cap (interchange walking). */
  readonly maxTransferMinutes?: number;
  /**
   * When **true**, omit the app’s **weekday 08:30 London** default when you do not set date/time
   * (TfL’s own “now” default applies instead).
   */
  readonly omitDefaultPlannerDeparture?: boolean;
}

export type SchoolPhaseDto = 'primary' | 'secondary' | 'sixth_form';

export interface WorkplaceDto {
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface CommuteDto {
  readonly maxMinutes: number;
  readonly mode: CommuteModeDto;
  readonly transit?: TransitCommutePreferencesDto;
}

export interface SchoolsDto {
  readonly phases: readonly SchoolPhaseDto[];
  readonly maxWalkOrDriveMinutes?: number;
}

export interface CrimeDto {
  readonly windowMonths: number;
  readonly categoryWeights: Readonly<Record<string, number>>;
}

/** Optional scoring controls (defaults preserve legacy four-dimension composite). */
export interface ScoringDto {
  /**
   * When **true**, **UK HPI year-on-year borough price momentum** (relative among candidates) is
   * blended into the composite score. Does not imply investment advice.
   */
  readonly includePriceTrendInComposite: boolean;
}

/**
 * Optional **second score** (not in headline composite): how well a borough’s **illustrative**
 * typical internal floor area matches your minimum, for **London** only.
 */
export interface SizeFitDto {
  /** Minimum total internal floor area in square metres. */
  readonly minFloorAreaM2: number;
}

export interface SearchAreasRequestBody {
  readonly maxPriceGbp: number;
  readonly maxPricePerM2Gbp?: number;
  readonly propertyTypes: readonly PropertyTypeDto[];
  readonly workplace: WorkplaceDto;
  readonly commute: CommuteDto;
  readonly schools: SchoolsDto;
  readonly crime: CrimeDto;
  readonly scoring?: ScoringDto;
  readonly sizeFit?: SizeFitDto;
}

export interface AreaScoreBreakdownDto {
  readonly affordability: number;
  readonly commute: number;
  readonly schools: number;
  readonly crime: number;
  /** Relative 0–100 momentum from UK HPI YoY among this search’s candidates (borough-level). */
  readonly priceTrend: number;
  /**
   * 0–100 **second score** only: relative headroom vs {@link SizeFitDto} among candidates.
   * **Not** blended into {@link RankedAreaDto.score}.
   */
  readonly sizeFit: number;
}

export interface RankedAreaDto {
  readonly id: string;
  readonly displayName: string;
  readonly centroidLatitude: number;
  readonly centroidLongitude: number;
  readonly score: number;
  readonly breakdown: AreaScoreBreakdownDto;
  /**
   * Includes domain-specific keys (e.g. `sizeFitModel`, `sizeFitTypicalM2Coverage`, `sizeFitEpcGeneratedAt`,
   * `commuteModel`, `commuteTflHttpStatus` (TfL HTTP status when transit falls back; **-1** if status was unavailable), `commuteTflHttpErrorBody`
   * (short TfL response text for non-2xx), …) as `string | number` for JSON transport.
   */
  readonly metadata?: Readonly<Record<string, string | number>>;
}

export interface SearchAreasResponse {
  readonly areas: readonly RankedAreaDto[];
}
