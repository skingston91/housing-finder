/**
 * Optional per-search **crime subscore** distribution logging for Lambda/local debugging.
 * Enable with `HOUSING_FINDER_SCORING_DIAGNOSTICS=1` in the SearchAreas function environment.
 */
export interface NumericStats {
  readonly n: number;
  readonly min: number;
  readonly max: number;
  readonly mean: number;
  readonly stddev: number;
}

export const numericStatsForFiniteValues = (values: readonly number[]): NumericStats | null => {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) {
    return null;
  }
  const n = finite.length;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const mean = finite.reduce((a, b) => a + b, 0) / n;
  const variance = n === 1 ? 0 : finite.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1);
  const stddev = Math.sqrt(variance);
  return {
    n,
    min: Math.round(min * 1000) / 1000,
    max: Math.round(max * 1000) / 1000,
    mean: Math.round(mean * 1000) / 1000,
    stddev: Math.round(stddev * 1000) / 1000,
  };
};

export const logCrimeScoreSearchDiagnostics = (
  crimeScoresFinal: readonly number[],
  context: { readonly candidateCount: number },
): void => {
  if (process.env.HOUSING_FINDER_SCORING_DIAGNOSTICS !== '1') {
    return;
  }
  const stats = numericStatsForFiniteValues(crimeScoresFinal);
  if (stats === null) {
    return;
  }
  console.log(
    JSON.stringify({
      msg: 'crime_score_search_diagnostics',
      candidateCount: context.candidateCount,
      crimeSubscore: stats,
    }),
  );
};
