export interface LondonSchoolPerformanceManifest {
  readonly generatedAtIso: string;
  readonly inputs: readonly string[];
  readonly schoolsPerformanceAcademicYear?: string;
  readonly urnCount: number;
  readonly rowsIn: number;
  readonly rowsWithUrn: number;
  readonly rowsDroppedNoUrn: number;
  readonly rowsDroppedNoMappedScore: number;
  readonly rowsMapped: number;
  readonly mappedSecondaryRows: number;
  readonly mappedSixthFormRows: number;
  readonly mappedPrimaryRows: number;
  readonly candidateUnmappedMetricColumns: Readonly<Record<string, number>>;
}

/** Updated by `scripts/ingest-dfe-performance.mjs` alongside the URN performance map. */
export const LONDON_SCHOOL_PERFORMANCE_MANIFEST: LondonSchoolPerformanceManifest = {
  generatedAtIso: '1970-01-01T00:00:00.000Z',
  inputs: [],
  urnCount: 0,
  rowsIn: 0,
  rowsWithUrn: 0,
  rowsDroppedNoUrn: 0,
  rowsDroppedNoMappedScore: 0,
  rowsMapped: 0,
  mappedSecondaryRows: 0,
  mappedSixthFormRows: 0,
  mappedPrimaryRows: 0,
  candidateUnmappedMetricColumns: {},
} as const;
