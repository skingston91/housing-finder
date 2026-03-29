import type { RankedArea } from '@/domain/area/types';
import type { AreaSearchCriteria } from '@/domain/criteria/types';
import type { SearchAreasRequestBody, SearchAreasResponse } from '@shared/searchAreasContract';
import { postSearchAreas } from '@/services/searchAreasClient';

import { areaSearchCriteriaToRequestBody, rankedAreaDtosToDomain } from './mapSearchAreasContract';
import type { AreaDiscoveryPort } from './ports';

export type SearchAreasPoster = (body: SearchAreasRequestBody) => Promise<SearchAreasResponse>;

export const createHttpAreaDiscoveryAdapter = (post: SearchAreasPoster): AreaDiscoveryPort => ({
  async findRankedAreas(criteria: AreaSearchCriteria): Promise<readonly RankedArea[]> {
    const body = areaSearchCriteriaToRequestBody(criteria);
    const res = await post(body);
    return rankedAreaDtosToDomain(res.areas);
  },
});

/** Default browser adapter: `/api/search-areas` via `fetch`. */
export const httpAreaDiscoveryAdapter: AreaDiscoveryPort = createHttpAreaDiscoveryAdapter((body) =>
  postSearchAreas(body),
);
