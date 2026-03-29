/**
 * Maps internal London borough ids (see `londonBoroughMedians.ts`) to UK HPI region path
 * segments used by the Land Registry linked-data API, e.g.
 * `https://landregistry.data.gov.uk/data/ukhpi/region/{slug}/…`.
 */
export const UKHPI_REGION_SLUG_BY_BOROUGH_ID: Readonly<Record<string, string>> = {
  'barking-dagenham': 'barking-and-dagenham',
  barnet: 'barnet',
  bexley: 'bexley',
  brent: 'brent',
  bromley: 'bromley',
  camden: 'camden',
  croydon: 'croydon',
  ealing: 'ealing',
  greenwich: 'greenwich',
  hackney: 'hackney',
  'hammersmith-fulham': 'hammersmith-and-fulham',
  haringey: 'haringey',
  harrow: 'harrow',
  havering: 'havering',
  hillingdon: 'hillingdon',
  hounslow: 'hounslow',
  islington: 'islington',
  'kensington-chelsea': 'kensington-and-chelsea',
  kingston: 'kingston-upon-thames',
  lambeth: 'lambeth',
  lewisham: 'lewisham',
  merton: 'merton',
  newham: 'newham',
  redbridge: 'redbridge',
  richmond: 'richmond-upon-thames',
  southwark: 'southwark',
  sutton: 'sutton',
  'tower-hamlets': 'tower-hamlets',
  'waltham-forest': 'waltham-forest',
  wandsworth: 'wandsworth',
  westminster: 'westminster',
};
