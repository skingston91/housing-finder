import { affordabilityScoreForAreaSearch } from '../affordability/affordabilityScoreFromMedian';
import { nearestBoroughMedian } from '../affordability/nearestBoroughMedian';
import { commuteScoreFromStraightLine } from '../commute/commuteScoreFromStraightLine';
import type { AreaScoreBreakdownDto, SearchAreasRequestBody } from '../searchAreasContract';
import { schoolsScoreFromSeeds } from '../schools/schoolsScoreFromSeeds';

export interface DimensionContext {
  readonly affordabilityBoroughId: string;
  readonly affordabilityBoroughName: string;
}

/** Affordability + schools (sync). Commute is resolved separately so Lambda can call TfL when configured. */
export const scoreAffordabilitySchoolsDimensions = (
  body: SearchAreasRequestBody,
  candidateLat: number,
  candidateLng: number,
): Pick<AreaScoreBreakdownDto, 'affordability' | 'schools'> & DimensionContext => {
  const borough = nearestBoroughMedian(candidateLat, candidateLng);
  const affordability = affordabilityScoreForAreaSearch(
    body.maxPriceGbp,
    borough.medianPriceGbp,
    body.maxPricePerM2Gbp,
  );
  const schools = schoolsScoreFromSeeds(body.schools, candidateLat, candidateLng);
  return {
    affordability,
    schools,
    affordabilityBoroughId: borough.id,
    affordabilityBoroughName: borough.boroughName,
  };
};

/**
 * All non-crime dimensions using straight-line commute only (stub / tests without async TfL).
 */
export const scoreNonCrimeDimensions = (
  body: SearchAreasRequestBody,
  candidateLat: number,
  candidateLng: number,
): Pick<AreaScoreBreakdownDto, 'affordability' | 'commute' | 'schools'> & DimensionContext => {
  const base = scoreAffordabilitySchoolsDimensions(body, candidateLat, candidateLng);
  const commute = commuteScoreFromStraightLine(
    body.workplace.latitude,
    body.workplace.longitude,
    candidateLat,
    candidateLng,
    body.commute.mode,
    body.commute.maxMinutes,
  );
  return {
    ...base,
    commute,
  };
};
