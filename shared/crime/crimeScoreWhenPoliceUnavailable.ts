/**
 * When data.police.uk requests fail for an area, we use this 0–100 crime subscore (higher = better).
 * Set **below neutral 50** so areas without real crime data do not rank as if they were average
 * on crime (which previously inflated total score vs areas with actual low incident counts).
 */
export const CRIME_SCORE_WHEN_POLICE_UNAVAILABLE = 28;
