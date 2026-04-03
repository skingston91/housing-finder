import type { PropertyTypeDto } from '../searchAreasContract';

import { INNER_LONDON_BOROUGH_IDS } from './innerLondonBoroughIds';

/**
 * **Honest model:** rounded **illustrative** typical **internal** floor areas (m²) by **inner vs outer**
 * London and **property type**. Not from the EPC register—an order-of-magnitude planning prior so the
 * second score can discriminate boroughs until real MHCLG aggregates are ingested.
 *
 * Replace with register-backed medians when `docs/data-sources.md` documents the ingest.
 *
 * **User-facing caveats** are centralized in `src/pages/AreaSearchPage/sizeFitUserContext.ts`.
 */
const TYPICAL_M2_INNER_OUTER: Readonly<
  Record<PropertyTypeDto, { readonly inner: number; readonly outer: number }>
> = {
  flat: { inner: 55, outer: 68 },
  terraced: { inner: 88, outer: 108 },
  semi_detached: { inner: 92, outer: 118 },
  detached: { inner: 115, outer: 145 },
  bungalow: { inner: 85, outer: 95 },
  other: { inner: 75, outer: 95 },
};

export const heuristicTypicalFloorM2ForBorough = (
  boroughId: string,
  propertyType: PropertyTypeDto,
): number => {
  const row = TYPICAL_M2_INNER_OUTER[propertyType];
  const inner = INNER_LONDON_BOROUGH_IDS.has(boroughId);
  return inner ? row.inner : row.outer;
};
