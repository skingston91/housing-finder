import type { LondonBoroughMedianRow } from './londonBoroughMedians';

/**
 * Representative **illustrative** median prices (£) for outer South East commuter areas (not GLA boroughs).
 * Rounded public-order-of-magnitude figures for discovery UX — same caveats as
 * {@link LONDON_BOROUGH_MEDIANS}. Nearest-anchor matching extends affordability outside core London.
 */
export const SOUTH_EAST_COMMUTER_MEDIAN_ANCHORS: readonly LondonBoroughMedianRow[] = [
  {
    id: 'brighton-hove',
    boroughName: 'Brighton & Hove',
    latitude: 50.8225,
    longitude: -0.1373,
    medianPriceGbp: 385_000,
  },
  {
    id: 'reading',
    boroughName: 'Reading',
    latitude: 51.4545,
    longitude: -0.973,
    medianPriceGbp: 415_000,
  },
  {
    id: 'guildford',
    boroughName: 'Guildford',
    latitude: 51.2362,
    longitude: -0.5704,
    medianPriceGbp: 525_000,
  },
  {
    id: 'crawley',
    boroughName: 'Crawley',
    latitude: 51.1092,
    longitude: -0.1872,
    medianPriceGbp: 355_000,
  },
  {
    id: 'chelmsford',
    boroughName: 'Chelmsford',
    latitude: 51.7356,
    longitude: 0.4685,
    medianPriceGbp: 375_000,
  },
  {
    id: 'maidstone',
    boroughName: 'Maidstone',
    latitude: 51.272,
    longitude: 0.529,
    medianPriceGbp: 335_000,
  },
  {
    id: 'canterbury',
    boroughName: 'Canterbury',
    latitude: 51.2802,
    longitude: 1.0789,
    medianPriceGbp: 365_000,
  },
  {
    id: 'basildon',
    boroughName: 'Basildon',
    latitude: 51.5761,
    longitude: 0.4887,
    medianPriceGbp: 315_000,
  },
  {
    id: 'eastbourne',
    boroughName: 'Eastbourne',
    latitude: 50.768,
    longitude: 0.2904,
    medianPriceGbp: 305_000,
  },
  {
    id: 'worthing',
    boroughName: 'Worthing',
    latitude: 50.8179,
    longitude: -0.3727,
    medianPriceGbp: 345_000,
  },
  {
    id: 'windsor-maidenhead',
    boroughName: 'Windsor and Maidenhead',
    latitude: 51.4839,
    longitude: -0.6044,
    medianPriceGbp: 565_000,
  },
  {
    id: 'colchester',
    boroughName: 'Colchester',
    latitude: 51.8892,
    longitude: 0.9045,
    medianPriceGbp: 325_000,
  },
];
