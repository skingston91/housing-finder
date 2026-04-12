import type { RankedArea } from '@/domain/area/types';
import type { AreaSearchCriteria } from '@/domain/criteria/types';
import { LONDON_BOROUGH_MEDIANS } from '@shared/affordability/londonBoroughMedians';
import type { SearchAreasRequestBody, SearchAreasResponse } from '@shared/searchAreasContract';
import { buildMapStyleAreaHeading } from '@shared/rankAreas/buildMapStyleAreaHeading';
import { disambiguateDuplicateAreaDisplayNames } from '@shared/rankAreas/disambiguateDuplicateAreaDisplayNames';
import { postSearchAreas } from '@/services/searchAreasClient';

import { areaSearchCriteriaToRequestBody, rankedAreaDtosToDomain } from './mapSearchAreasContract';
import type { AreaDiscoveryPort } from './ports';

export type SearchAreasPoster = (body: SearchAreasRequestBody) => Promise<SearchAreasResponse>;

const applyMapStyleHeadings = (
  body: SearchAreasRequestBody,
  areas: readonly RankedArea[],
): readonly RankedArea[] => {
  const withHeadings = areas.map((area) => {
    if (area.metadata?.candidateMode !== 'workplace-grid') {
      return area;
    }
    return {
      ...area,
      displayName: buildMapStyleAreaHeading(
        body.workplace,
        { latitude: area.centroidLatitude, longitude: area.centroidLongitude },
        LONDON_BOROUGH_MEDIANS,
      ),
    };
  });
  return disambiguateDuplicateAreaDisplayNames(withHeadings);
};

export const createHttpAreaDiscoveryAdapter = (post: SearchAreasPoster): AreaDiscoveryPort => ({
  async findRankedAreas(criteria: AreaSearchCriteria): Promise<readonly RankedArea[]> {
    const body = areaSearchCriteriaToRequestBody(criteria);
    const res = await post(body);
    return applyMapStyleHeadings(body, rankedAreaDtosToDomain(res.areas));
  },
});

/** Default browser adapter: `/api/search-areas` via `fetch`. */
export const httpAreaDiscoveryAdapter: AreaDiscoveryPort = createHttpAreaDiscoveryAdapter((body) =>
  postSearchAreas(body),
);
