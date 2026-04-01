/**
 * Plain-language line for the schools dimension from search result metadata (no extra API fields).
 * Keep copy factual; avoid implying admissions or catchment guarantees.
 */
export const schoolsDimensionExplanationLine = (
  metadata: Readonly<Record<string, string | number>> | undefined,
): string | null => {
  if (metadata === undefined) {
    return null;
  }
  const model = metadata.schoolsModel;
  if (typeof model !== 'string') {
    return null;
  }

  const yearRaw = metadata.schoolsPerformanceAcademicYear;
  const year = typeof yearRaw === 'string' ? yearRaw.trim() : '';
  const cov = metadata.schoolsPerformanceCoveragePct;
  const matched = metadata.schoolsPointsMatchedByUrn;
  const withUrn = metadata.schoolsPointsWithUrn;

  if (model === 'gias-open-data-sample-dfe-performance-urn-map') {
    let s =
      'Distance to schools matching your phases, blended with DfE performance where we have a URN match.';
    if (year.length > 0) {
      s += ` Performance release: ${year}.`;
    }
    if (
      typeof cov === 'number' &&
      Number.isFinite(cov) &&
      typeof matched === 'number' &&
      Number.isFinite(matched) &&
      typeof withUrn === 'number' &&
      Number.isFinite(withUrn) &&
      withUrn > 0
    ) {
      s += ` URN match rate on sample points: ${cov.toFixed(0)}% (${matched.toString()}/${withUrn.toString()}).`;
    }
    return s;
  }
  if (model === 'gias-open-data-sample-performance-seed-prototype') {
    return 'Distance to schools matching your phases, blended with illustrative performance seeds (ingest DfE CSVs for official measures).';
  }
  if (model === 'gias-open-data-sample') {
    return 'Distance to schools matching your phases (no performance blend in this build).';
  }
  return null;
};
