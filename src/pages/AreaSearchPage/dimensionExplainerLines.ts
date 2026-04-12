import type { RankedArea } from '@/domain/area/types';
import { formatCommuteJourneyDurationForDisplay } from '@shared/commute/formatCommuteJourneyDurationForDisplay';

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
    bits.push(formatCommuteJourneyDurationForDisplay(mins));
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
  if (
    typeof metadata.commuteRoutingApiFailureExtraPenaltyApplied === 'number' &&
    metadata.commuteRoutingApiFailureExtraPenaltyApplied > 0
  ) {
    bits.push(
      `-${String(metadata.commuteRoutingApiFailureExtraPenaltyApplied)} no confirmed route (routing API failed)`,
    );
  }
  if (
    typeof metadata.commuteReliabilityFactor === 'number' &&
    Number.isFinite(metadata.commuteReliabilityFactor) &&
    metadata.commuteReliabilityFactor < 1
  ) {
    bits.push(
      `reliability ×${metadata.commuteReliabilityFactor.toFixed(3)} (included in commute subscore above)`,
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
  const notInHeadline =
    metadata.priceTrendAppliedToComposite === 0
      ? ' Not in headline total — YoY data was unavailable or all candidates tied, so momentum is not blended into the composite for this search.'
      : '';
  if (metadata.stub === 1) {
    return `Demo ranking: price momentum fixed at neutral 50.${notInHeadline}`;
  }
  const model = metadata.priceTrendModel;
  if (model === 'unavailable' || model === undefined) {
    return `UK HPI YoY not loaded for this search — neutral 50 (enable live UK HPI on the API for relative momentum).${notInHeadline}`;
  }
  if (model === 'ukhpi-borough-yoy') {
    const yoy = metadata.priceTrendYoyPct;
    const hasSpread = metadata.priceTrendHasSpread === 1;
    if (typeof yoy === 'number' && Number.isFinite(yoy)) {
      return hasSpread
        ? `Borough YoY ≈ ${yoy.toFixed(1)}% — score ranks candidates in this search only.${notInHeadline}`
        : `Borough YoY ≈ ${yoy.toFixed(1)}% — all candidates tie at 50 (same or single YoY in this batch).${notInHeadline}`;
    }
    return `Neutral 50 — no YoY for this borough or insufficient prior-year data.${notInHeadline}`;
  }
  return `Relative momentum among candidates; not a forecast.${notInHeadline}`;
};
