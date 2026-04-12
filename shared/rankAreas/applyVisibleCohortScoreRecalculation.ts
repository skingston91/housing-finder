import { normalizeYoYPctToScores } from '../affordability/priceTrendScoreFromYoY';
import {
  applyCrimeMonthCompleteness,
  crimeScoresNormalizedAmongCandidates,
  type CrimeNormalizationRow,
} from '../crime/crimeScoresNormalizedAmongCandidates';
import { normalizeCommuteScoresAmongCandidates } from '../commute/normalizeCommuteScoresAmongCandidates';
import { compositeScore, compositeScoreWithPriceTrend } from '../scoring/compositeScore';
import { normalizeSizeFitRatiosToScores } from '../sizeFit/normalizeSizeFitRatiosToScores';
import type { RankedAreaDto } from '../searchAreasContract';

export interface VisibleCohortRecalculationContext {
  readonly crimeInputs: readonly CrimeNormalizationRow[];
  readonly monthsYmLen: number;
  readonly monthsSucceededByIndex: readonly number[];
  readonly rawYoyList: readonly (number | null)[];
  readonly sizeFitRawRatios: readonly (number | null)[];
  /** Raw commute subscores from routing (`resolveCommuteScore`) before cohort spread. */
  readonly commuteRawScores: readonly number[];
  readonly includePriceTrendInComposite: boolean;
  readonly priceTrendModel: string;
}

/**
 * Recompute **relative** dimensions (crime, price momentum, size fit, commute spread) for the
 * **visible** candidate list only, then rebuild headline scores. Keeps affordability and schools
 * unchanged. Call after dropping estimate-only commute rows (or on the full list: same as
 * pre-filter cohort when nothing was removed).
 */
export const applyVisibleCohortScoreRecalculation = (
  visible: readonly RankedAreaDto[],
  keptIndices: readonly number[],
  ctx: VisibleCohortRecalculationContext,
): RankedAreaDto[] => {
  if (visible.length === 0 || keptIndices.length !== visible.length) {
    return [...visible];
  }

  const crimeSubset = keptIndices.map((i) => {
    const row = ctx.crimeInputs[i];
    if (row === undefined) {
      throw new Error(`crimeInputs missing at index ${String(i)}`);
    }
    return row;
  });
  const crimeNorm = crimeScoresNormalizedAmongCandidates(crimeSubset);
  const crimeFinal = crimeNorm.map((score, j) => {
    const origIdx = keptIndices[j];
    if (origIdx === undefined) {
      throw new Error(`keptIndices missing at ${String(j)}`);
    }
    const monthsSucceeded = ctx.monthsSucceededByIndex[origIdx];
    if (monthsSucceeded === undefined) {
      throw new Error(`monthsSucceededByIndex missing at ${String(origIdx)}`);
    }
    return applyCrimeMonthCompleteness(score, monthsSucceeded, ctx.monthsYmLen);
  });

  const yoySubset = keptIndices.map((i) => ctx.rawYoyList[i] ?? null);
  const priceTrendScores = normalizeYoYPctToScores(yoySubset);

  const sizeFitSubset = keptIndices.map((i) => ctx.sizeFitRawRatios[i] ?? null);
  const sizeFitScores = normalizeSizeFitRatiosToScores(sizeFitSubset);

  const commuteRawSubset = keptIndices.map((i) => {
    const s = ctx.commuteRawScores[i];
    if (s === undefined) {
      throw new Error(`commuteRawScores missing at index ${String(i)}`);
    }
    return s;
  });
  const commuteScores = normalizeCommuteScoresAmongCandidates(commuteRawSubset);

  const yoyFinite = yoySubset.filter((v): v is number => v !== null && Number.isFinite(v));
  const priceTrendHasSpreadVisible =
    ctx.priceTrendModel === 'ukhpi-borough-yoy' &&
    yoyFinite.length >= 2 &&
    Math.min(...yoyFinite) < Math.max(...yoyFinite);
  const usePriceTrendInComposite = ctx.includePriceTrendInComposite && priceTrendHasSpreadVisible;

  return visible.map((row, j) => {
    const affordability = row.breakdown.affordability;
    const schools = row.breakdown.schools;
    const crime = crimeFinal[j] ?? 50;
    const pt = priceTrendScores[j];
    const priceTrend = typeof pt === 'number' && Number.isFinite(pt) ? pt : 50;
    const sf = sizeFitScores[j];
    const sizeFit = typeof sf === 'number' && Number.isFinite(sf) ? sf : 50;
    const cm = commuteScores[j];
    const commute = typeof cm === 'number' && Number.isFinite(cm) ? cm : 50;

    const breakdown = {
      affordability,
      commute,
      schools,
      crime,
      priceTrend,
      sizeFit,
    };

    const score = usePriceTrendInComposite
      ? compositeScoreWithPriceTrend(breakdown)
      : compositeScore({
          affordability: breakdown.affordability,
          commute: breakdown.commute,
          schools: breakdown.schools,
          crime: breakdown.crime,
        });

    const meta = row.metadata ?? {};
    return {
      ...row,
      score,
      breakdown,
      metadata: {
        ...meta,
        priceTrendHasSpread: priceTrendHasSpreadVisible ? 1 : 0,
        priceTrendAppliedToComposite: usePriceTrendInComposite ? 1 : 0,
        cohortRecalculatedForVisibleSet: 1,
        commuteNormalizedAmongVisible: 1,
      },
    };
  });
};

/**
 * Map each visible row to its original candidate index in the pre-filter `rows` array (same order
 * as {@link filterRankedAreasToNetworkRoutedWhenMixed} output).
 */
export const keptIndicesForVisibleRows = (
  fullRows: readonly RankedAreaDto[],
  visible: readonly RankedAreaDto[],
): number[] => {
  const idToIndex = new Map<string, number>();
  for (let i = 0; i < fullRows.length; i++) {
    const r = fullRows[i];
    if (r !== undefined) {
      idToIndex.set(r.id, i);
    }
  }
  return visible.map((v) => {
    const idx = idToIndex.get(v.id);
    if (idx === undefined) {
      throw new Error(`applyVisibleCohortScoreRecalculation: missing index for area id ${v.id}`);
    }
    return idx;
  });
};
