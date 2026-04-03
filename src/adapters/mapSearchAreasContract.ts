import type { RankedArea } from '@/domain/area/types';
import type { AreaSearchCriteria } from '@/domain/criteria/types';
import type { RankedAreaDto, SearchAreasRequestBody } from '@shared/searchAreasContract';

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
});

export const rankedAreaDtoToDomain = (dto: RankedAreaDto): RankedArea => ({
  id: dto.id,
  displayName: dto.displayName,
  centroidLatitude: dto.centroidLatitude,
  centroidLongitude: dto.centroidLongitude,
  score: dto.score,
  breakdown: { ...dto.breakdown },
  ...(dto.metadata !== undefined ? { metadata: { ...dto.metadata } } : {}),
});

export const rankedAreaDtosToDomain = (dtos: readonly RankedAreaDto[]): readonly RankedArea[] =>
  dtos.map(rankedAreaDtoToDomain);
