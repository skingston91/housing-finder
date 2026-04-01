import { LONDON_SCHOOL_PERFORMANCE_BY_URN } from './londonSchoolPerformanceByUrn';
import { resolveSchoolsPerformanceAcademicYearForMetadata } from './resolveSchoolsPerformanceAcademicYearForMetadata';

/**
 * Short OGL-style attribution line for ranked-area metadata and the results footer.
 * Wording aligns with `resolveSchoolsRankingMetadataModel` (URN performance map vs seed prototype).
 */
export const resolveSchoolsDataAttribution = (): string => {
  const hasOfficialPerformance = Object.keys(LONDON_SCHOOL_PERFORMANCE_BY_URN).length > 0;
  const year = resolveSchoolsPerformanceAcademicYearForMetadata();
  const yearBit =
    hasOfficialPerformance && year !== undefined ? ` Data release: academic year ${year}.` : '';
  if (hasOfficialPerformance) {
    return `School locations: Get Information about Schools / DfE open data (OGL). Performance: ingested Department for Education statistical releases—confirm licence and year for your use; indicative only, not admissions advice.${yearBit}`;
  }
  return 'School locations: expanded London sample in the DfE/GIAS open-data family (OGL). Performance: illustrative seed values until official DfE tables are ingested; indicative only.';
};
