import type {
  CommuteScoreResult,
  ResolveCommuteScoreRoutingOptions,
} from '../commute/resolveCommuteScore';
import { resolveCommuteScore } from '../commute/resolveCommuteScore';
import type { SearchAreasRequestBody } from '../searchAreasContract';
import type { SearchCandidate } from './workplaceGridCandidates';

/**
 * When the grid is **mixed** (some TfL successes, some straight-line fallbacks), only **re-attempt** a
 * **small** set of high-impact fallbacks. A full second pass for every fallback would duplicate TfL
 * volume (~96 extra calls) and blow Lambda time budgets.
 */
export const MAX_TFL_MIXED_FALLBACK_RETRIES = 8;

interface Row {
  readonly c: SearchCandidate;
  readonly commuteRes: CommuteScoreResult;
  readonly base: { readonly affordability: number; readonly schools: number };
}

const partialPreCrimeScore = (row: Row): number =>
  row.base.affordability + row.base.schools + row.commuteRes.score;

const hasStrictTransitFilters = (body: SearchAreasRequestBody): boolean => {
  const t = body.commute.transit;
  if (t === undefined) {
    return false;
  }
  return (
    t.requireMultipleJourneys === true ||
    t.atMostOneRailLeg === true ||
    t.atMostOnePublicTransportLeg === true
  );
};

const withRelaxedTransitFilters = (body: SearchAreasRequestBody): SearchAreasRequestBody => {
  const t = body.commute.transit;
  return {
    ...body,
    commute: {
      ...body.commute,
      transit:
        t === undefined
          ? undefined
          : {
              ...t,
              requireMultipleJourneys: false,
              atMostOneRailLeg: false,
              atMostOnePublicTransportLeg: false,
            },
    },
  };
};

/**
 * After the initial parallel grid, if **both** routed and fallback TfL results exist, retry a capped
 * number of **highest partial-score** fallbacks (affordability + schools + commute, no crime yet).
 * Helps transient TfL failures and strict client-side filters (`no_journey_after_filters`) without
 * doubling API volume for the whole grid.
 */
export const retryTflFallbackCommutesWhenMixed = async <T extends Row>(
  intermediate: readonly T[],
  body: SearchAreasRequestBody,
  fetchForSearch: typeof fetch,
  routing?: ResolveCommuteScoreRoutingOptions,
): Promise<T[]> => {
  if (body.commute.mode !== 'transit') {
    return [...intermediate];
  }
  if (routing === undefined) {
    return [...intermediate];
  }
  const appKey = (routing.tfl?.appKey ?? '').trim();
  if (appKey === '') {
    return [...intermediate];
  }

  const hasRouted = intermediate.some((r) => r.commuteRes.model === 'tfl-unified-api');
  const hasProxy = intermediate.some((r) => r.commuteRes.model === 'tfl-fallback-straight-line');
  if (!hasRouted || !hasProxy) {
    return [...intermediate];
  }

  const fallbackRanked = intermediate
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.commuteRes.model === 'tfl-fallback-straight-line')
    .sort((a, b) => partialPreCrimeScore(b.row) - partialPreCrimeScore(a.row))
    .slice(0, MAX_TFL_MIXED_FALLBACK_RETRIES);

  const out: T[] = intermediate.map((row) => ({ ...row }));
  for (const { index } of fallbackRanked) {
    const row = out[index];
    if (row === undefined) {
      continue;
    }
    let res = await resolveCommuteScore(
      body,
      row.c.latitude,
      row.c.longitude,
      fetchForSearch,
      routing,
    );
    if (res.model === 'tfl-unified-api') {
      out[index] = { ...row, commuteRes: res };
      continue;
    }
    if (hasStrictTransitFilters(body) && res.transitFailureCode === 'no_journey_after_filters') {
      res = await resolveCommuteScore(
        withRelaxedTransitFilters(body),
        row.c.latitude,
        row.c.longitude,
        fetchForSearch,
        routing,
      );
      if (res.model === 'tfl-unified-api') {
        out[index] = { ...row, commuteRes: res };
      }
    }
  }
  return out;
};
