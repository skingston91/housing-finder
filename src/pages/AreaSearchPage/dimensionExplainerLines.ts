import type { RankedArea } from '@/domain/area/types';

import { commuteModelDisplayLabel } from './commuteModelLabels';

/**
 * One line under the commute bar: model, estimated minutes, budget, and why the score often hits 100.
 */
export const commuteDimensionExplanationLine = (
  metadata: RankedArea['metadata'] | undefined,
): string | null => {
  if (!metadata) {
    return null;
  }
  const maxM =
    typeof metadata.commuteMaxMinutes === 'number' ? metadata.commuteMaxMinutes : undefined;
  const mins =
    typeof metadata.commuteJourneyMinutes === 'number' ? metadata.commuteJourneyMinutes : undefined;
  const model = typeof metadata.commuteModel === 'string' ? metadata.commuteModel : '';
  const label = commuteModelDisplayLabel(model);
  const bits: string[] = [label];
  if (mins !== undefined) {
    bits.push(`~${mins.toFixed(1)} min`);
  }
  if (maxM !== undefined) {
    bits.push(`vs ${String(maxM)} min budget`);
  }
  if (mins !== undefined && maxM !== undefined && maxM > 0) {
    const ratio = mins / maxM;
    if (ratio <= 0.75) {
      bits.push('commute score 100 (≤75% of budget)');
    } else if (ratio >= 1.5) {
      bits.push('commute score 0 (≥150% of budget)');
    } else {
      bits.push(`${(ratio * 100).toFixed(0)}% of budget`);
    }
  }
  if (
    typeof metadata.commuteNetworkRoutingBonusApplied === 'number' &&
    metadata.commuteNetworkRoutingBonusApplied > 0
  ) {
    bits.push(`+${String(metadata.commuteNetworkRoutingBonusApplied)} network-route bonus`);
  }
  if (
    typeof metadata.commuteStraightLineProxyPenaltyApplied === 'number' &&
    metadata.commuteStraightLineProxyPenaltyApplied > 0
  ) {
    bits.push(
      `-${String(metadata.commuteStraightLineProxyPenaltyApplied)} straight-line proxy (no routed time)`,
    );
  }
  return bits.join(' · ');
};

/**
 * One line under the price momentum bar: YoY source, spread, and why 50 is common.
 */
export const priceTrendDimensionExplanationLine = (
  metadata: RankedArea['metadata'] | undefined,
): string | null => {
  if (!metadata) {
    return null;
  }
  if (metadata.stub === 1) {
    return 'Demo ranking: price momentum fixed at neutral 50.';
  }
  const model = metadata.priceTrendModel;
  if (model === 'unavailable' || model === undefined) {
    return 'UK HPI YoY not loaded for this search — neutral 50 (enable live UK HPI on the API for relative momentum).';
  }
  if (model === 'ukhpi-borough-yoy') {
    const yoy = metadata.priceTrendYoyPct;
    const hasSpread = metadata.priceTrendHasSpread === 1;
    if (typeof yoy === 'number' && Number.isFinite(yoy)) {
      return hasSpread
        ? `Borough YoY ≈ ${yoy.toFixed(1)}% — score ranks candidates in this search only.`
        : `Borough YoY ≈ ${yoy.toFixed(1)}% — all candidates tie at 50 (same or single YoY in this batch).`;
    }
    return 'Neutral 50 — no YoY for this borough or insufficient prior-year data.';
  }
  return 'Relative momentum among candidates; not a forecast.';
};
