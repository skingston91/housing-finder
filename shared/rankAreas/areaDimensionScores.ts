import { affordabilityScoreFromMedian } from '../affordability/affordabilityScoreFromMedian';
import { nearestBoroughMedian } from '../affordability/nearestBoroughMedian';
import { commuteScoreFromStraightLine } from '../commute/commuteScoreFromStraightLine';
import type { AreaScoreBreakdownDto, SearchAreasRequestBody } from '../searchAreasContract';
import { schoolsScoreFromSeeds } from '../schools/schoolsScoreFromSeeds';

export interface DimensionContext {
  readonly affordabilityBoroughId: string;
  readonly affordabilityBoroughName: string;
}

export const scoreNonCrimeDimensions = (
  body: SearchAreasRequestBody,
  candidateLat: number,
  candidateLng: number,
): Pick<AreaScoreBreakdownDto, 'affordability' | 'commute' | 'schools'> & DimensionContext => {
  const borough = nearestBoroughMedian(candidateLat, candidateLng);
  const affordability = affordabilityScoreFromMedian(body.maxPriceGbp, borough.medianPriceGbp);
  const commute = commuteScoreFromStraightLine(
    body.workplace.latitude,
    body.workplace.longitude,
    candidateLat,
    candidateLng,
    body.commute.mode,
    body.commute.maxMinutes,
  );
  const schools = schoolsScoreFromSeeds(body.schools, candidateLat, candidateLng);
  return {
    affordability,
    commute,
    schools,
    affordabilityBoroughId: borough.id,
    affordabilityBoroughName: borough.boroughName,
  };
};
