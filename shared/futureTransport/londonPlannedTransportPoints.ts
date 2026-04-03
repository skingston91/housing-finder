/**
 * **Spike:** representative waypoints for **publicly discussed** Greater London transport schemes
 * (TfL / national rail consultations). Coordinates are **approximate** area centres for discovery
 * — not engineering alignment. Replace with curated OGL geometry before any production promise.
 *
 * @see docs/data-sources.md — “Planned transport (Greater London spike)”
 */

/** Bump when waypoints or source URLs are manually reviewed (ISO 8601 calendar date, UTC). */
export const LONDON_PLANNED_TRANSPORT_DATA_LAST_REVIEWED = '2026-04-03' as const;

export interface LondonPlannedTransportPoint {
  readonly id: string;
  readonly schemeLabel: string;
  readonly pointLabel: string;
  readonly latitude: number;
  readonly longitude: number;
  /** Primary official or consultation page for the scheme (verify licence before reuse). */
  readonly sourceUrl: string;
}

/**
 * Fixed set of waypoints inside **Greater London** used only for **nearest-point** proximity in the
 * spike. Order is not significant; the engine picks the **closest** point per candidate centroid.
 */
export const LONDON_PLANNED_TRANSPORT_POINTS: readonly LondonPlannedTransportPoint[] = [
  {
    id: 'bakerloo-lewisham',
    schemeLabel: 'Bakerloo line extension (TfL)',
    pointLabel: 'Lewisham (indicative southern end)',
    latitude: 51.446,
    longitude: -0.01,
    sourceUrl: 'https://tfl.gov.uk/transport-projects/bakerloo-line-extension',
  },
  {
    id: 'bakerloo-old-kent-road',
    schemeLabel: 'Bakerloo line extension (TfL)',
    pointLabel: 'Old Kent Road corridor',
    latitude: 51.488,
    longitude: -0.062,
    sourceUrl: 'https://tfl.gov.uk/transport-projects/bakerloo-line-extension',
  },
  {
    id: 'old-oak-common',
    schemeLabel: 'Old Oak Common / HS2 interchange area',
    pointLabel: 'Old Oak Common (major interchange)',
    latitude: 51.531,
    longitude: -0.245,
    sourceUrl: 'https://www.hs2.org.uk/where-and-why/stations-and-interchanges/old-oak-common/',
  },
  {
    id: 'beckton-riverside',
    schemeLabel: 'Docklands / east London growth (illustrative)',
    pointLabel: 'Beckton / Royal Docks east',
    latitude: 51.515,
    longitude: 0.055,
    sourceUrl: 'https://www.london.gov.uk/what-we-do/planning-implemented-london/london-plan',
  },
  {
    id: 'tottenham-hale',
    schemeLabel: 'North-east corridor (Crossrail 2 — long-term)',
    pointLabel: 'Tottenham Hale (strategic node)',
    latitude: 51.588,
    longitude: -0.06,
    sourceUrl: 'https://tfl.gov.uk/transport-projects/crossrail-2',
  },
  {
    id: 'wimbledon',
    schemeLabel: 'South-west corridor (Crossrail 2 — long-term)',
    pointLabel: 'Wimbledon (strategic node)',
    latitude: 51.421,
    longitude: -0.206,
    sourceUrl: 'https://tfl.gov.uk/transport-projects/crossrail-2',
  },
  {
    id: 'thamesmead',
    schemeLabel: 'Thamesmead / south-east river crossing context',
    pointLabel: 'Thamesmead area',
    latitude: 51.51,
    longitude: 0.12,
    sourceUrl: 'https://www.london.gov.uk/what-we-do/transport/river-crossings',
  },
  {
    id: 'hillingdon-west',
    schemeLabel: 'West London / Heathrow access context',
    pointLabel: 'Heathrow / west London access (illustrative)',
    latitude: 51.471,
    longitude: -0.454,
    sourceUrl: 'https://www.heathrow.com/company/about-heathrow/expansion',
  },
];
