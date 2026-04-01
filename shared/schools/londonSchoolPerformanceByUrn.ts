import type { SchoolPhaseDto } from '../searchAreasContract';

/**
 * URN → performance by phase (0–100), from official DfE performance CSVs (OGL family).
 * Populate by running `npm run ingest:dfe -- <one-or-more.csv>`.
 *
 * Academic year label (e.g. `2023/24`): set via `--academic-year` when ingesting, or inferred from CSV filenames.
 */
export type LondonSchoolPerformanceByUrn = Readonly<
  Record<string, Partial<Record<SchoolPhaseDto, number>>>
>;

export const LONDON_SCHOOL_PERFORMANCE_ACADEMIC_YEAR: string | undefined = undefined;

export const LONDON_SCHOOL_PERFORMANCE_BY_URN: LondonSchoolPerformanceByUrn = {} as const;
