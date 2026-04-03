/**
 * ONS **local authority district** codes (LAMA) for London boroughs in this app — same slug keys as
 * `shared/affordability/londonBoroughMedians.ts`. Used to query MHCLG EPC Open Data by
 * `local-authority`.
 *
 * @see https://epc.opendatacommunities.org/docs/api/domestic (local-authority filter)
 */
export const LONDON_BOROUGH_ONS_LOCAL_AUTHORITY_CODE: Readonly<Record<string, string>> = {
  'barking-dagenham': 'E09000002',
  barnet: 'E09000003',
  bexley: 'E09000004',
  brent: 'E09000005',
  bromley: 'E09000006',
  camden: 'E09000007',
  croydon: 'E09000008',
  ealing: 'E09000009',
  greenwich: 'E09000011',
  hackney: 'E09000012',
  'hammersmith-fulham': 'E09000013',
  haringey: 'E09000014',
  harrow: 'E09000015',
  havering: 'E09000016',
  hillingdon: 'E09000017',
  hounslow: 'E09000018',
  islington: 'E09000019',
  'kensington-chelsea': 'E09000020',
  kingston: 'E09000021',
  lambeth: 'E09000022',
  lewisham: 'E09000023',
  merton: 'E09000024',
  newham: 'E09000025',
  redbridge: 'E09000026',
  richmond: 'E09000027',
  southwark: 'E09000028',
  sutton: 'E09000029',
  'tower-hamlets': 'E09000030',
  'waltham-forest': 'E09000031',
  wandsworth: 'E09000032',
  westminster: 'E09000033',
} as const;
