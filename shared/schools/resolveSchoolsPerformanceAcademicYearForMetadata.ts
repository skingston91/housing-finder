import { LONDON_SCHOOL_PERFORMANCE_ACADEMIC_YEAR } from './londonSchoolPerformanceByUrn';
import { LONDON_SCHOOL_PERFORMANCE_MANIFEST } from './londonSchoolPerformanceManifest';

/** Normalised academic-year label from the generated performance module (ingest `--academic-year` or inferred). */
export const resolveSchoolsPerformanceAcademicYearForMetadata = (): string | undefined => {
  const fromManifest = LONDON_SCHOOL_PERFORMANCE_MANIFEST.schoolsPerformanceAcademicYear;
  if (typeof fromManifest === 'string') {
    const tManifest = fromManifest.trim();
    if (tManifest.length > 0) {
      return tManifest;
    }
  }
  const y = LONDON_SCHOOL_PERFORMANCE_ACADEMIC_YEAR;
  if (typeof y !== 'string') {
    return undefined;
  }
  const t = y.trim();
  return t.length > 0 ? t : undefined;
};
