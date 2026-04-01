import { LONDON_SCHOOL_PERFORMANCE_BY_URN } from './londonSchoolPerformanceByUrn';

export type SchoolsRankingMetadataModel =
  | 'gias-open-data-sample-dfe-performance-urn-map'
  | 'gias-open-data-sample-performance-seed-prototype';

export const resolveSchoolsRankingMetadataModel = (): SchoolsRankingMetadataModel =>
  Object.keys(LONDON_SCHOOL_PERFORMANCE_BY_URN).length > 0
    ? 'gias-open-data-sample-dfe-performance-urn-map'
    : 'gias-open-data-sample-performance-seed-prototype';
