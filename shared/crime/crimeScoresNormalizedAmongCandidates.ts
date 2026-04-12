import { CRIME_SCORE_WHEN_POLICE_UNAVAILABLE } from './crimeScoreWhenPoliceUnavailable';

export type PoliceUkFetchStatus = 'ok' | 'partial' | 'error';

export interface CrimeNormalizationRow {
  /** Mean weighted incident count per succeeded month (`total / monthsSucceeded`). */
  readonly weightedAvgPerMonth: number | null;
  readonly policeUk: PoliceUkFetchStatus;
}

/**
 * Map average weighted crime load → 0–100 **relative to other candidates in this search**.
 * Lower average load → higher score (safer / less weighted crime exposure).
 * Rows with `policeUk === 'error'` use {@link CRIME_SCORE_WHEN_POLICE_UNAVAILABLE} (not ranked as average).
 * When all loaded values tie or only one value exists, every non-error row scores **50** (neutral).
 */
export const crimeScoresNormalizedAmongCandidates = (
  inputs: readonly CrimeNormalizationRow[],
): number[] => {
  const values: number[] = [];
  for (const row of inputs) {
    if (row.policeUk === 'error') {
      continue;
    }
    const v = row.weightedAvgPerMonth;
    if (v !== null && Number.isFinite(v) && v >= 0) {
      values.push(v);
    }
  }

  if (values.length === 0) {
    return inputs.map((row) =>
      row.policeUk === 'error' ? CRIME_SCORE_WHEN_POLICE_UNAVAILABLE : 50,
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return inputs.map((row) => {
    if (row.policeUk === 'error') {
      return CRIME_SCORE_WHEN_POLICE_UNAVAILABLE;
    }
    const v = row.weightedAvgPerMonth;
    if (v === null || !Number.isFinite(v) || v < 0) {
      return 50;
    }
    if (max === min) {
      return 50;
    }
    const scaled = Math.round(((max - v) / (max - min)) * 100);
    return Math.max(0, Math.min(100, scaled));
  });
};

/**
 * Pull crime score toward **50** when fewer months loaded than requested (partial police.uk window).
 * Full coverage (`ratio === 1`) leaves `score` unchanged.
 */
export const applyCrimeMonthCompleteness = (
  score: number,
  monthsSucceeded: number,
  monthsRequested: number,
): number => {
  if (monthsRequested <= 0 || monthsSucceeded <= 0) {
    return score;
  }
  const ratio = Math.min(1, monthsSucceeded / monthsRequested);
  if (ratio >= 1) {
    return score;
  }
  return Math.round(50 + (score - 50) * ratio);
};
