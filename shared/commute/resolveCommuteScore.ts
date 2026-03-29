import type { SearchAreasRequestBody } from '../searchAreasContract';

import { commuteScoreFromDurationEstimate } from './commuteScoreFromDurationEstimate';
import { commuteScoreFromStraightLine } from './commuteScoreFromStraightLine';
import { fetchOrsRouteDurationMinutes, type OrsApiCredentials } from './orsDirections';
import { fetchTflTransitJourneyMinutes, type TflApiCredentials } from './tflJourney';

export type CommuteModelId =
  | 'tfl-unified-api'
  | 'straight-line-time-estimate'
  | 'tfl-fallback-straight-line'
  | 'openrouteservice-directions'
  | 'openrouteservice-fallback-straight-line';

export interface CommuteScoreResult {
  readonly score: number;
  readonly model: CommuteModelId;
  /** Present when a routing API returned a journey (minutes). */
  readonly journeyMinutes?: number;
}

export interface ResolveCommuteScoreRoutingOptions {
  readonly tfl?: TflApiCredentials;
  /** When set, **driving** / **cycling** / **walking** use OpenRouteService directions (London-friendly); **transit** still uses TfL only. */
  readonly openRouteService?: OrsApiCredentials;
}

export const resolveCommuteScore = async (
  body: SearchAreasRequestBody,
  candidateLat: number,
  candidateLng: number,
  fetchImpl: typeof fetch,
  routing?: ResolveCommuteScoreRoutingOptions,
): Promise<CommuteScoreResult> => {
  const { workplace, commute } = body;
  const maxM = commute.maxMinutes;
  const mode = commute.mode;

  if (mode === 'transit' && routing?.tfl !== undefined && routing.tfl.appKey !== '') {
    const mins = await fetchTflTransitJourneyMinutes(
      workplace.latitude,
      workplace.longitude,
      candidateLat,
      candidateLng,
      fetchImpl,
      routing.tfl,
    );
    if (mins !== null) {
      return {
        score: commuteScoreFromDurationEstimate(mins, maxM),
        model: 'tfl-unified-api',
        journeyMinutes: Math.round(mins * 10) / 10,
      };
    }
    return {
      score: commuteScoreFromStraightLine(
        workplace.latitude,
        workplace.longitude,
        candidateLat,
        candidateLng,
        mode,
        maxM,
      ),
      model: 'tfl-fallback-straight-line',
    };
  }

  if (
    (mode === 'driving' || mode === 'cycling' || mode === 'walking') &&
    routing?.openRouteService !== undefined &&
    routing.openRouteService.apiKey !== ''
  ) {
    const mins = await fetchOrsRouteDurationMinutes(
      mode,
      workplace.latitude,
      workplace.longitude,
      candidateLat,
      candidateLng,
      fetchImpl,
      routing.openRouteService,
    );
    if (mins !== null) {
      return {
        score: commuteScoreFromDurationEstimate(mins, maxM),
        model: 'openrouteservice-directions',
        journeyMinutes: Math.round(mins * 10) / 10,
      };
    }
    return {
      score: commuteScoreFromStraightLine(
        workplace.latitude,
        workplace.longitude,
        candidateLat,
        candidateLng,
        mode,
        maxM,
      ),
      model: 'openrouteservice-fallback-straight-line',
    };
  }

  return {
    score: commuteScoreFromStraightLine(
      workplace.latitude,
      workplace.longitude,
      candidateLat,
      candidateLng,
      mode,
      maxM,
    ),
    model: 'straight-line-time-estimate',
  };
};
