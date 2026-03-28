/**
 * HTTP contract for POST /api/search-areas.
 * Shared between Vite client and Vercel serverless handlers (no imports from `src/` in `api/`).
 */

export type PropertyTypeDto =
  | 'flat'
  | 'terraced'
  | 'semi_detached'
  | 'detached'
  | 'bungalow'
  | 'other';

export type CommuteModeDto = 'driving' | 'transit' | 'cycling' | 'walking';

export type SchoolPhaseDto = 'primary' | 'secondary' | 'sixth_form';

export interface WorkplaceDto {
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface CommuteDto {
  readonly maxMinutes: number;
  readonly mode: CommuteModeDto;
}

export interface SchoolsDto {
  readonly phases: readonly SchoolPhaseDto[];
  readonly maxWalkOrDriveMinutes?: number;
}

export interface CrimeDto {
  readonly windowMonths: number;
  readonly categoryWeights: Readonly<Record<string, number>>;
}

export interface SearchAreasRequestBody {
  readonly maxPriceGbp: number;
  readonly maxPricePerM2Gbp?: number;
  readonly propertyTypes: readonly PropertyTypeDto[];
  readonly workplace: WorkplaceDto;
  readonly commute: CommuteDto;
  readonly schools: SchoolsDto;
  readonly crime: CrimeDto;
}

export interface AreaScoreBreakdownDto {
  readonly affordability: number;
  readonly commute: number;
  readonly schools: number;
  readonly crime: number;
}

export interface RankedAreaDto {
  readonly id: string;
  readonly displayName: string;
  readonly centroidLatitude: number;
  readonly centroidLongitude: number;
  readonly score: number;
  readonly breakdown: AreaScoreBreakdownDto;
  readonly metadata?: Readonly<Record<string, string | number>>;
}

export interface SearchAreasResponse {
  readonly areas: readonly RankedAreaDto[];
}
