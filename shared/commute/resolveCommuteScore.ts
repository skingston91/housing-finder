import type { SearchAreasRequestBody, TransitCommutePreferencesDto } from '../searchAreasContract';

import { applyCommuteReliabilityAdjustments } from './applyCommuteReliabilityAdjustments';
import { commuteScoreFromDurationEstimate } from './commuteScoreFromDurationEstimate';
import { commuteScoreFromStraightLine } from './commuteScoreFromStraightLine';
import { fetchOrsRouteDurationMinutes, type OrsApiCredentials } from './orsDirections';
import {
  fetchTflTransitJourney,
  type TflApiCredentials,
  type TflTransitFailureCode,
  type TflTransitPlannerPreferences,
} from './tflJourney';

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
  /** When transit used TfL but fell back to straight-line scoring. */
  readonly transitFailureCode?: TflTransitFailureCode;
  /** Second qualifying TfL journey (minutes) when alternatives remain after filters. */
  readonly commuteAlternativeJourneyMinutes?: number;
  /** Short hint when TfL attached disruption data to the chosen journey. */
  readonly transitDisruptionHint?: string;
  /** Successful journey came from TfL **`nationalSearch=true`** attempt. */
  readonly transitNationalSearchUsed?: boolean;
  /** Product of reliability multipliers when below 1 (disruption / route volatility). */
  readonly commuteReliabilityFactor?: number;
}

export interface ResolveCommuteScoreRoutingOptions {
  readonly tfl?: TflApiCredentials;
  /** When set, **driving** / **cycling** / **walking** use OpenRouteService directions (London-friendly); **transit** still uses TfL only. */
  readonly openRouteService?: OrsApiCredentials;
}

const transitDtoToPlanner = (t: TransitCommutePreferencesDto): TflTransitPlannerPreferences => ({
  journeyPreference: t.journeyPreference,
  includeAlternativeRoutes: t.includeAlternativeRoutes,
  avoidLineIds: t.avoidLineIds,
  requireMultipleJourneys: t.requireMultipleJourneys,
  atMostOneRailLeg: t.atMostOneRailLeg,
  atMostOnePublicTransportLeg: t.atMostOnePublicTransportLeg,
  dateYyyyMmDd: t.dateYyyyMmDd,
  timeHhMm: t.timeHhMm,
  timeIsDeparting: t.timeIsDeparting,
  maxWalkingMinutes: t.maxWalkingMinutes,
  maxTransferMinutes: t.maxTransferMinutes,
  omitDefaultPlannerDeparture: t.omitDefaultPlannerDeparture,
});

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
    const plannerPrefs =
      commute.transit !== undefined ? transitDtoToPlanner(commute.transit) : undefined;
    const tflRes = await fetchTflTransitJourney(
      workplace.latitude,
      workplace.longitude,
      candidateLat,
      candidateLng,
      fetchImpl,
      routing.tfl,
      plannerPrefs,
    );
    if (tflRes.minutes !== null) {
      const alt = tflRes.alternativeJourneyMinutes;
      const baseScore = commuteScoreFromDurationEstimate(tflRes.minutes, maxM);
      const reliability = applyCommuteReliabilityAdjustments({
        baseScore,
        transitDisruptionHint: tflRes.disruptionHint,
        primaryJourneyMinutes: tflRes.minutes,
        alternativeJourneyMinutes: alt,
      });
      return {
        score: reliability.score,
        model: 'tfl-unified-api',
        journeyMinutes: Math.round(tflRes.minutes * 10) / 10,
        ...(reliability.factor < 1 ? { commuteReliabilityFactor: reliability.factor } : {}),
        ...(alt !== undefined
          ? { commuteAlternativeJourneyMinutes: Math.round(alt * 10) / 10 }
          : {}),
        ...(tflRes.disruptionHint !== undefined
          ? { transitDisruptionHint: tflRes.disruptionHint }
          : {}),
        ...(tflRes.nationalSearchUsed === true ? { transitNationalSearchUsed: true } : {}),
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
      transitFailureCode: tflRes.failureCode,
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
