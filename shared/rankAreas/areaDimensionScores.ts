import { affordabilityScoreForAreaSearch } from '../affordability/affordabilityScoreFromMedian';
import type { LondonBoroughMedianRow } from '../affordability/londonBoroughMedians';
import { LONDON_BOROUGH_MEDIANS } from '../affordability/londonBoroughMedians';
import { nearestBoroughMedianFromRows } from '../affordability/nearestBoroughMedian';
import { commuteScoreFromStraightLine } from '../commute/commuteScoreFromStraightLine';
import type { AreaScoreBreakdownDto, SearchAreasRequestBody } from '../searchAreasContract';
import { LONDON_SCHOOL_POINTS_FOR_RANKING } from '../schools/londonSchoolPointsForRanking';
import { schoolsScoreFromEstablishmentPoints } from '../schools/schoolsScoreFromEstablishmentPoints';

export interface DimensionContext {
  readonly affordabilityBoroughId: string;
  readonly affordabilityBoroughName: string;
}

/** Affordability + schools (sync). Commute is resolved separately so Lambda can call TfL when configured. */
export const scoreAffordabilitySchoolsDimensions = (
  body: SearchAreasRequestBody,
  candidateLat: number,
  candidateLng: number,
  medianRows: readonly LondonBoroughMedianRow[] = LONDON_BOROUGH_MEDIANS,
): Pick<AreaScoreBreakdownDto, 'affordability' | 'schools'> & DimensionContext => {
  const borough = nearestBoroughMedianFromRows(candidateLat, candidateLng, medianRows);
  const affordability = affordabilityScoreForAreaSearch(
    body.maxPriceGbp,
    borough.medianPriceGbp,
    body.maxPricePerM2Gbp,
  );
  const schools = schoolsScoreFromEstablishmentPoints(
    body.schools,
    candidateLat,
    candidateLng,
    LONDON_SCHOOL_POINTS_FOR_RANKING,
  );
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
  medianRows: readonly LondonBoroughMedianRow[] = LONDON_BOROUGH_MEDIANS,
): Pick<AreaScoreBreakdownDto, 'affordability' | 'commute' | 'schools'> & DimensionContext => {
  const base = scoreAffordabilitySchoolsDimensions(body, candidateLat, candidateLng, medianRows);
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
