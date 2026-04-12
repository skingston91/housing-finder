/**
 * Sort tier for ranked results: **0** = commute used a network routing API (TfL / ORS) or plain
 * straight-line when no routing API was configured; **1** = routing API was called but returned no
 * usable journey (straight-line fallback after an API attempt).
 */
export const commuteRankTierForModel = (model: string): 0 | 1 =>
  model === 'tfl-fallback-straight-line' || model === 'openrouteservice-fallback-straight-line'
    ? 1
    : 0;
