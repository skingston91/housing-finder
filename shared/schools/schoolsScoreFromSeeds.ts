import type { SchoolsDto } from '../searchAreasContract';

import { LONDON_SCHOOL_SEEDS } from './londonSchoolSeeds';
import { schoolsScoreFromEstablishmentPoints } from './schoolsScoreFromEstablishmentPoints';

/**
 * Distance to nearest **seed** school only (tests and narrow comparisons).
 * Live ranking uses `schoolsScoreFromEstablishmentPoints` with `LONDON_SCHOOL_POINTS_FOR_RANKING`.
 */
export const schoolsScoreFromSeeds = (
  schools: SchoolsDto,
  candidateLat: number,
  candidateLng: number,
): number =>
  schoolsScoreFromEstablishmentPoints(schools, candidateLat, candidateLng, LONDON_SCHOOL_SEEDS);
