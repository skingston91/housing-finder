import { LONDON_SCHOOL_PERFORMANCE_BY_URN } from './londonSchoolPerformanceByUrn';
import type { LondonSchoolSeed } from './londonSchoolSeeds';
import { LONDON_SCHOOL_SEEDS } from './londonSchoolSeeds';
import { LONDON_STATE_SCHOOL_ESTABLISHMENT_SAMPLE } from './londonStateSchoolEstablishmentSample';
import { mergePerformanceIntoSchoolSeeds } from './mergePerformanceIntoSchoolSeeds';
import { SOUTH_EAST_COMMUTER_SCHOOL_SEEDS } from './southEastCommuterSchoolSeeds';

const BASE_LONDON_SCHOOL_POINTS_FOR_RANKING = [
  ...LONDON_SCHOOL_SEEDS,
  ...LONDON_STATE_SCHOOL_ESTABLISHMENT_SAMPLE,
  ...SOUTH_EAST_COMMUTER_SCHOOL_SEEDS,
] as const;

const hasUrn = (p: LondonSchoolSeed): boolean =>
  typeof p.urn === 'string' && p.urn.trim().length > 0;

const pointsWithUrn = BASE_LONDON_SCHOOL_POINTS_FOR_RANKING.filter(hasUrn);

/** Number of ranking points that carry a URN and can be joined to DfE performance tables. */
export const SCHOOLS_POINTS_WITH_URN = pointsWithUrn.length;

/** Number of URN-bearing points that matched a generated DfE performance map entry. */
export const SCHOOLS_POINTS_MATCHED_BY_URN = pointsWithUrn.filter((p) => {
  const urn = p.urn?.trim();
  return urn !== undefined && LONDON_SCHOOL_PERFORMANCE_BY_URN[urn] !== undefined;
}).length;

/** Join coverage (%) among points that have URNs. */
export const SCHOOLS_PERFORMANCE_COVERAGE_PCT =
  SCHOOLS_POINTS_WITH_URN > 0
    ? Math.round((SCHOOLS_POINTS_MATCHED_BY_URN / SCHOOLS_POINTS_WITH_URN) * 1000) / 10
    : 0;

/** Seeds plus expanded London sample, with optional DfE performance merged by URN. */
export const LONDON_SCHOOL_POINTS_FOR_RANKING: readonly LondonSchoolSeed[] =
  mergePerformanceIntoSchoolSeeds(
    BASE_LONDON_SCHOOL_POINTS_FOR_RANKING,
    LONDON_SCHOOL_PERFORMANCE_BY_URN,
  );
