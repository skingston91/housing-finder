import type { PropertyTypeDto } from '../searchAreasContract';

/**
 * **Bottleneck** across selected types: minimum of (typical m² for type ÷ user minimum).
 * Lower means the strictest type is tight vs the user’s floor-area bar.
 */
export const sizeFitHeadroomRatio = (
  boroughId: string,
  propertyTypes: readonly PropertyTypeDto[],
  userMinFloorAreaM2: number,
  typicalM2: (bid: string, t: PropertyTypeDto) => number,
): number | null => {
  if (!Number.isFinite(userMinFloorAreaM2) || userMinFloorAreaM2 <= 0) {
    return null;
  }
  let best: number | null = null;
  for (const t of propertyTypes) {
    const m = typicalM2(boroughId, t);
    if (!Number.isFinite(m) || m <= 0) {
      continue;
    }
    const r = m / userMinFloorAreaM2;
    best = best === null ? r : Math.min(best, r);
  }
  return best;
};
