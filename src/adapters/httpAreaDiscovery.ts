import type { RankedArea } from '@/domain/area/types';
import type { AreaSearchCriteria } from '@/domain/criteria/types';
import type { LondonBoroughMedianRow } from '@shared/affordability/londonBoroughMedians';
import { LONDON_BOROUGH_MEDIANS } from '@shared/affordability/londonBoroughMedians';
import { medianRowsForAreaDiscovery } from '@shared/affordability/medianRowsForAreaDiscovery';
import type { SearchAreasRequestBody, SearchAreasResponse } from '@shared/searchAreasContract';
import { buildMapStyleAreaHeading } from '@shared/rankAreas/buildMapStyleAreaHeading';
import { disambiguateDuplicateAreaDisplayNames } from '@shared/rankAreas/disambiguateDuplicateAreaDisplayNames';
import { postSearchAreas } from '@/services/searchAreasClient';

import { areaSearchCriteriaToRequestBody, rankedAreaDtosToDomain } from './mapSearchAreasContract';
import type { AreaDiscoveryPort, RankedAreasSearchResult } from './ports';

export type SearchAreasPoster = (body: SearchAreasRequestBody) => Promise<SearchAreasResponse>;

const applyMapStyleHeadingsToAreas = (
  body: SearchAreasRequestBody,
  areas: readonly RankedArea[],
  medianRows: readonly LondonBoroughMedianRow[],
): RankedArea[] =>
  areas.map((area) => {
    if (area.metadata?.candidateMode !== 'workplace-grid') {
      return area;
    }
    return {
      ...area,
      displayName: buildMapStyleAreaHeading(
        body.workplace,
        { latitude: area.centroidLatitude, longitude: area.centroidLongitude },
        medianRows,
      ),
    };
  });

/**
 * Map-style headings must be **disambiguated across** the ranked list **and** the omitted (estimate-only)
 * list. Disambiguating each array separately lets two different centroids share the same label (e.g.
 * “… · Reading”) in both places without coordinate suffixes — looks like a duplicate bug.
 */
const applyMapStyleHeadingsMainAndOmitted = (
  body: SearchAreasRequestBody,
  main: readonly RankedArea[],
  omitted: readonly RankedArea[] | undefined,
): { readonly areas: readonly RankedArea[]; readonly omitted?: readonly RankedArea[] } => {
  const medianRows = medianRowsForAreaDiscovery(LONDON_BOROUGH_MEDIANS);
  const mainWith = applyMapStyleHeadingsToAreas(body, main, medianRows);
  if (omitted === undefined || omitted.length === 0) {
    return { areas: disambiguateDuplicateAreaDisplayNames(mainWith) };
  }
  const omittedWith = applyMapStyleHeadingsToAreas(body, omitted, medianRows);
  const combined = disambiguateDuplicateAreaDisplayNames([...mainWith, ...omittedWith]);
  const n = mainWith.length;
  return {
    areas: combined.slice(0, n),
    omitted: combined.slice(n),
  };
};

export const createHttpAreaDiscoveryAdapter = (post: SearchAreasPoster): AreaDiscoveryPort => ({
  async findRankedAreas(criteria: AreaSearchCriteria): Promise<RankedAreasSearchResult> {
    const body = areaSearchCriteriaToRequestBody(criteria);
    const res = await post(body);
    const mainDomain = rankedAreaDtosToDomain(res.areas);
    const omittedDomain =
      res.commuteOmittedEstimateOnlyAreas !== undefined &&
      res.commuteOmittedEstimateOnlyAreas.length > 0
        ? rankedAreaDtosToDomain(res.commuteOmittedEstimateOnlyAreas)
        : undefined;
    const { areas, omitted } = applyMapStyleHeadingsMainAndOmitted(body, mainDomain, omittedDomain);
    return {
      areas,
      ...(res.commuteOmittedEstimateOnlyCount !== undefined
        ? { commuteOmittedEstimateOnlyCount: res.commuteOmittedEstimateOnlyCount }
        : {}),
      ...(omitted !== undefined && omitted.length > 0
        ? { commuteOmittedEstimateOnlyAreas: omitted }
        : {}),
    };
  },
});

/** Default browser adapter: `/api/search-areas` via `fetch`. */
export const httpAreaDiscoveryAdapter: AreaDiscoveryPort = createHttpAreaDiscoveryAdapter((body) =>
  postSearchAreas(body),
);
