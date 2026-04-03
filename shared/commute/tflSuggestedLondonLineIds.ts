/**
 * Common **tube** line ids for UI hints (`commute.transit.avoidLineIds`). These match typical
 * `lineIdentifier.id` values in TfL journey legs; National Rail / branch Overground ids differ.
 */
export const TFL_SUGGESTED_LINE_IDS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'bakerloo', label: 'Bakerloo' },
  { id: 'central', label: 'Central' },
  { id: 'circle', label: 'Circle' },
  { id: 'district', label: 'District' },
  { id: 'dlr', label: 'DLR' },
  { id: 'elizabeth-line', label: 'Elizabeth line' },
  { id: 'hammersmith-city', label: 'Hammersmith & City' },
  { id: 'jubilee', label: 'Jubilee' },
  { id: 'metropolitan', label: 'Metropolitan' },
  { id: 'northern', label: 'Northern' },
  { id: 'piccadilly', label: 'Piccadilly' },
  { id: 'victoria', label: 'Victoria' },
  { id: 'waterloo-city', label: 'Waterloo & City' },
];
