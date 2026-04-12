import { isNetworkRoutedCommuteModel } from '../commute/isNetworkRoutedCommuteModel';
import type { RankedAreaDto, SearchAreasRequestBody } from '../searchAreasContract';

/** Matches {@link import('./buildRankedAreas').BuildRankedAreasOptions} routing fields (avoids circular imports). */
export interface RankedAreasRoutingCredentials {
  readonly tfl?: { readonly appKey: string };
  readonly openRouteService?: { readonly apiKey: string };
}

/**
 * True when this search **could** use TfL (transit) or ORS (drive/cycle/walk), i.e. credentials
 * were passed into {@link buildRankedAreas}.
 */
export const routingApiExpectedForSearch = (
  body: SearchAreasRequestBody,
  options?: RankedAreasRoutingCredentials,
): boolean => {
  const mode = body.commute.mode;
  const tfl = options?.tfl?.appKey !== undefined && options.tfl.appKey.trim() !== '';
  const ors =
    options?.openRouteService?.apiKey !== undefined &&
    options.openRouteService.apiKey.trim() !== '';
  if (mode === 'transit') {
    return tfl;
  }
  return ors;
};

/**
 * When a routing API is in use and **both** network-routed and proxy commute scores exist,
 * keep **only** network-routed rows so headline rankings never mix real journey times with
 * straight-line guesses. If **no** candidate has a routed journey, keep everyone (all-proxy run).
 */
export const filterRankedAreasToNetworkRoutedWhenMixed = (
  rows: readonly RankedAreaDto[],
  body: SearchAreasRequestBody,
  options?: RankedAreasRoutingCredentials,
): { areas: readonly RankedAreaDto[]; omittedEstimateOnly: number } => {
  if (!routingApiExpectedForSearch(body, options)) {
    return { areas: rows, omittedEstimateOnly: 0 };
  }

  const networkRouted: RankedAreaDto[] = [];
  const proxy: RankedAreaDto[] = [];
  for (const r of rows) {
    const m = typeof r.metadata?.commuteModel === 'string' ? r.metadata.commuteModel : '';
    if (isNetworkRoutedCommuteModel(m)) {
      networkRouted.push(r);
    } else {
      proxy.push(r);
    }
  }

  if (networkRouted.length === 0 || proxy.length === 0) {
    return { areas: rows, omittedEstimateOnly: 0 };
  }

  return { areas: networkRouted, omittedEstimateOnly: proxy.length };
};
