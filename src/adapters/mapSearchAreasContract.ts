import type { RankedArea } from '@/domain/area/types';
import type { AreaSearchCriteria } from '@/domain/criteria/types';
import type { RankedAreaDto, SearchAreasRequestBody } from '@shared/searchAreasContract';

/** TfL HTTP status from area metadata (`commuteTflHttpStatus`), including numeric strings after JSON transport. */
export const parseCommuteTflHttpStatusFromMetadata = (
  metadata: Readonly<Record<string, string | number>> | undefined,
): number | undefined => {
  if (metadata === undefined) return undefined;
  const v = metadata.commuteTflHttpStatus;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const normalizeRankedAreaMetadata = (
  meta: Readonly<Record<string, string | number>>,
): Readonly<Record<string, string | number>> => {
  const n = parseCommuteTflHttpStatusFromMetadata(meta);
  if (n === undefined) return meta;
  if (typeof meta.commuteTflHttpStatus === 'number' && meta.commuteTflHttpStatus === n) {
    return meta;
  }
  return { ...meta, commuteTflHttpStatus: n };
};

/**
 * Maps domain search criteria to the HTTP contract. Lives in the adapter layer (outer),
 * not in `src/domain/`, so the domain stays free of transport DTOs.
 */
export const areaSearchCriteriaToRequestBody = (
  criteria: AreaSearchCriteria,
): SearchAreasRequestBody => ({
  maxPriceGbp: criteria.maxPriceGbp,
  maxPricePerM2Gbp: criteria.maxPricePerM2Gbp,
  propertyTypes: [...criteria.propertyTypes],
  workplace: {
    label: criteria.workplace.label,
    latitude: criteria.workplace.latitude,
    longitude: criteria.workplace.longitude,
  },
  commute: { ...criteria.commute },
  schools: {
    phases: [...criteria.schools.phases],
    maxWalkOrDriveMinutes: criteria.schools.maxWalkOrDriveMinutes,
  },
  crime: {
    windowMonths: criteria.crime.windowMonths,
    categoryWeights: { ...criteria.crime.categoryWeights },
  },
  ...(criteria.scoring !== undefined
    ? {
        scoring: { ...criteria.scoring },
      }
    : {}),
  ...(criteria.sizeFit !== undefined
    ? {
        sizeFit: { minFloorAreaM2: criteria.sizeFit.minFloorAreaM2 },
      }
    : {}),
});

export const rankedAreaDtoToDomain = (dto: RankedAreaDto): RankedArea => ({
  id: dto.id,
  displayName: dto.displayName,
  centroidLatitude: dto.centroidLatitude,
  centroidLongitude: dto.centroidLongitude,
  score: dto.score,
  breakdown: { ...dto.breakdown },
  ...(dto.metadata !== undefined
    ? { metadata: normalizeRankedAreaMetadata({ ...dto.metadata }) }
    : {}),
});

export const rankedAreaDtosToDomain = (dtos: readonly RankedAreaDto[]): readonly RankedArea[] =>
  dtos.map(rankedAreaDtoToDomain);
