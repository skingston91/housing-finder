/**
 * Slightly down-rank commute scores when TfL signals disruption or when a second acceptable
 * journey is much slower (route volatility). Keeps the same 0–100 scale.
 */
export interface CommuteReliabilityAdjustmentInput {
  readonly baseScore: number;
  /** Present when TfL attached disruption payloads to the chosen journey. */
  readonly transitDisruptionHint?: string;
  readonly primaryJourneyMinutes?: number;
  readonly alternativeJourneyMinutes?: number;
}

export interface CommuteReliabilityAdjustmentResult {
  readonly score: number;
  /** Product of applied multipliers in (0, 1], or 1 when unchanged. */
  readonly factor: number;
}

const DISRUPTION_FACTOR = 0.92;
/** When second journey is >20% slower than the first, apply a small penalty. */
const VOLATILITY_SPREAD_THRESHOLD = 1.2;
const VOLATILITY_FACTOR = 0.97;

export const applyCommuteReliabilityAdjustments = (
  input: CommuteReliabilityAdjustmentInput,
): CommuteReliabilityAdjustmentResult => {
  const { baseScore } = input;
  let factor = 1;

  if (input.transitDisruptionHint !== undefined && input.transitDisruptionHint.trim().length > 0) {
    factor *= DISRUPTION_FACTOR;
  }

  const primary = input.primaryJourneyMinutes;
  const alt = input.alternativeJourneyMinutes;
  if (
    primary !== undefined &&
    alt !== undefined &&
    primary > 0 &&
    alt > primary * VOLATILITY_SPREAD_THRESHOLD
  ) {
    factor *= VOLATILITY_FACTOR;
  }

  if (factor >= 1) {
    return { score: baseScore, factor: 1 };
  }
  return { score: Math.max(0, Math.round(baseScore * factor)), factor };
};
