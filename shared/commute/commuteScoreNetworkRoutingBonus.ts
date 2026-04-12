/**
 * Extra commute subscore points when a **network routing API** returns a usable journey (TfL or
 * OpenRouteService), vs straight-line time proxies. Set high enough that real timings materially
 * outrank distance/speed guesses.
 */
export const COMMUTE_SCORE_NETWORK_ROUTING_BONUS_POINTS = 25;

/**
 * Subtracted when the score is derived only from **haversine + assumed speed** (any model without a
 * routed duration). Makes proxy estimates clearly less valuable than TfL/ORS timings.
 */
export const COMMUTE_SCORE_STRAIGHT_LINE_PROXY_PENALTY_POINTS = 15;

export const applyNetworkRoutingCommuteBonus = (durationBasedScore: number): number => {
  if (!Number.isFinite(durationBasedScore)) {
    return 50;
  }
  return Math.round(
    Math.max(0, Math.min(100, durationBasedScore + COMMUTE_SCORE_NETWORK_ROUTING_BONUS_POINTS)),
  );
};

export const applyStraightLineProxyPenalty = (durationBasedScore: number): number => {
  if (!Number.isFinite(durationBasedScore)) {
    return 50;
  }
  return Math.round(
    Math.max(
      0,
      Math.min(100, durationBasedScore - COMMUTE_SCORE_STRAIGHT_LINE_PROXY_PENALTY_POINTS),
    ),
  );
};
