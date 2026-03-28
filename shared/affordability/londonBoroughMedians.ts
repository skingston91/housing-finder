/**
 * Indicative **median** sold prices (£) with borough **representative centroids** for proximity matching.
 * Rounded public-order-of-magnitude figures for UX — **not** a substitute for Land Registry SPARQL or
 * your solicitor. Refresh periodically from UK HPI / Land Registry statistical releases (OGL).
 */
export interface LondonBoroughMedianRow {
  readonly id: string;
  readonly boroughName: string;
  readonly latitude: number;
  readonly longitude: number;
  /** Indicative median property price (GBP), illustrative. */
  readonly medianPriceGbp: number;
}

export const LONDON_BOROUGH_MEDIANS: readonly LondonBoroughMedianRow[] = [
  {
    id: 'barking-dagenham',
    boroughName: 'Barking and Dagenham',
    latitude: 51.544,
    longitude: 0.151,
    medianPriceGbp: 340_000,
  },
  {
    id: 'barnet',
    boroughName: 'Barnet',
    latitude: 51.6255,
    longitude: -0.1517,
    medianPriceGbp: 520_000,
  },
  {
    id: 'bexley',
    boroughName: 'Bexley',
    latitude: 51.4415,
    longitude: 0.1487,
    medianPriceGbp: 380_000,
  },
  {
    id: 'brent',
    boroughName: 'Brent',
    latitude: 51.5534,
    longitude: -0.1991,
    medianPriceGbp: 480_000,
  },
  {
    id: 'bromley',
    boroughName: 'Bromley',
    latitude: 51.4057,
    longitude: 0.0192,
    medianPriceGbp: 470_000,
  },
  {
    id: 'camden',
    boroughName: 'Camden',
    latitude: 51.529,
    longitude: -0.1426,
    medianPriceGbp: 720_000,
  },
  {
    id: 'croydon',
    boroughName: 'Croydon',
    latitude: 51.3762,
    longitude: -0.0982,
    medianPriceGbp: 370_000,
  },
  {
    id: 'ealing',
    boroughName: 'Ealing',
    latitude: 51.517,
    longitude: -0.299,
    medianPriceGbp: 450_000,
  },
  {
    id: 'greenwich',
    boroughName: 'Greenwich',
    latitude: 51.4932,
    longitude: 0.0098,
    medianPriceGbp: 410_000,
  },
  {
    id: 'hackney',
    boroughName: 'Hackney',
    latitude: 51.5734,
    longitude: -0.0724,
    medianPriceGbp: 580_000,
  },
  {
    id: 'hammersmith-fulham',
    boroughName: 'Hammersmith and Fulham',
    latitude: 51.4928,
    longitude: -0.2339,
    medianPriceGbp: 650_000,
  },
  {
    id: 'haringey',
    boroughName: 'Haringey',
    latitude: 51.5906,
    longitude: -0.1109,
    medianPriceGbp: 510_000,
  },
  {
    id: 'harrow',
    boroughName: 'Harrow',
    latitude: 51.5923,
    longitude: -0.3345,
    medianPriceGbp: 490_000,
  },
  {
    id: 'havering',
    boroughName: 'Havering',
    latitude: 51.5779,
    longitude: 0.2121,
    medianPriceGbp: 400_000,
  },
  {
    id: 'hillingdon',
    boroughName: 'Hillingdon',
    latitude: 51.543,
    longitude: -0.476,
    medianPriceGbp: 420_000,
  },
  {
    id: 'hounslow',
    boroughName: 'Hounslow',
    latitude: 51.4683,
    longitude: -0.3566,
    medianPriceGbp: 400_000,
  },
  {
    id: 'islington',
    boroughName: 'Islington',
    latitude: 51.5416,
    longitude: -0.1022,
    medianPriceGbp: 640_000,
  },
  {
    id: 'kensington-chelsea',
    boroughName: 'Kensington and Chelsea',
    latitude: 51.4991,
    longitude: -0.1938,
    medianPriceGbp: 1_150_000,
  },
  {
    id: 'kingston',
    boroughName: 'Kingston upon Thames',
    latitude: 51.4085,
    longitude: -0.3064,
    medianPriceGbp: 500_000,
  },
  {
    id: 'lambeth',
    boroughName: 'Lambeth',
    latitude: 51.4571,
    longitude: -0.1141,
    medianPriceGbp: 550_000,
  },
  {
    id: 'lewisham',
    boroughName: 'Lewisham',
    latitude: 51.4415,
    longitude: -0.0117,
    medianPriceGbp: 450_000,
  },
  {
    id: 'merton',
    boroughName: 'Merton',
    latitude: 51.4014,
    longitude: -0.1948,
    medianPriceGbp: 480_000,
  },
  {
    id: 'newham',
    boroughName: 'Newham',
    latitude: 51.5255,
    longitude: 0.0354,
    medianPriceGbp: 390_000,
  },
  {
    id: 'redbridge',
    boroughName: 'Redbridge',
    latitude: 51.559,
    longitude: 0.0741,
    medianPriceGbp: 450_000,
  },
  {
    id: 'richmond',
    boroughName: 'Richmond upon Thames',
    latitude: 51.4479,
    longitude: -0.3256,
    medianPriceGbp: 720_000,
  },
  {
    id: 'southwark',
    boroughName: 'Southwark',
    latitude: 51.5028,
    longitude: -0.0926,
    medianPriceGbp: 560_000,
  },
  {
    id: 'sutton',
    boroughName: 'Sutton',
    latitude: 51.3606,
    longitude: -0.1949,
    medianPriceGbp: 420_000,
  },
  {
    id: 'tower-hamlets',
    boroughName: 'Tower Hamlets',
    latitude: 51.5099,
    longitude: -0.0059,
    medianPriceGbp: 450_000,
  },
  {
    id: 'waltham-forest',
    boroughName: 'Waltham Forest',
    latitude: 51.5908,
    longitude: -0.013,
    medianPriceGbp: 460_000,
  },
  {
    id: 'wandsworth',
    boroughName: 'Wandsworth',
    latitude: 51.4571,
    longitude: -0.1925,
    medianPriceGbp: 580_000,
  },
  {
    id: 'westminster',
    boroughName: 'Westminster',
    latitude: 51.4975,
    longitude: -0.1357,
    medianPriceGbp: 890_000,
  },
];
