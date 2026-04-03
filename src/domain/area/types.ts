/** Ranked geographic unit (ward, LSOA, postcode sector, etc. — to be aligned with data sources). */

export interface AreaScoreBreakdown {
  readonly affordability: number;
  readonly commute: number;
  readonly schools: number;
  readonly crime: number;
  /** UK HPI YoY momentum among candidates (0–100); not a price forecast. */
  readonly priceTrend: number;
  /** London heuristic floor-area headroom (0–100); not in headline {@link RankedArea.score}. */
  readonly sizeFit: number;
}

export interface RankedArea {
  readonly id: string;
  readonly displayName: string;
  readonly centroidLatitude: number;
  readonly centroidLongitude: number;
  /** 0–100 composite; how it is computed lives in scoring use-cases + docs/architecture.md */
  readonly score: number;
  readonly breakdown: AreaScoreBreakdown;
  /** Optional signals for UI tooltips (median £/m², sample size, etc.) */
  readonly metadata?: Readonly<Record<string, string | number>>;
}
