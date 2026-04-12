import type { SearchAreasRequestBody } from '../searchAreasContract';

/**
 * When strict routing is enabled, refuse to rank areas if the commute mode needs an API key
 * that is missing — instead of silently using straight-line time estimates.
 * Deployed Lambdas always use strict; SAM local uses `SEARCH_AREAS_ROUTING_STRICT` (see `resolveSearchAreasRoutingStrict`).
 */
export const validateSearchAreasRoutingKeys = (
  body: SearchAreasRequestBody,
  tflAppKey: string,
  orsApiKey: string,
  strict: boolean,
): string | null => {
  if (!strict) {
    return null;
  }
  const mode = body.commute.mode;
  if (mode === 'transit' && tflAppKey === '') {
    return 'Commute mode is transit but TFL_APP_KEY is not configured on the search API. Configure a TfL app key (see docs/infrastructure/aws-sam.md).';
  }
  if ((mode === 'driving' || mode === 'cycling' || mode === 'walking') && orsApiKey === '') {
    return 'Commute mode is driving, cycling, or walking but ORS_API_KEY is not configured on the search API. Configure an OpenRouteService key (see docs/infrastructure/aws-sam.md).';
  }
  return null;
};
