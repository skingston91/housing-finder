import type { SearchAreasRequestBody, TransitCommutePreferencesDto } from '../searchAreasContract';

import { applyCommuteReliabilityAdjustments } from './applyCommuteReliabilityAdjustments';
import {
  applyNetworkRoutingCommuteBonus,
  applyStraightLineProxyPenalty,
  COMMUTE_SCORE_NETWORK_ROUTING_BONUS_POINTS,
  COMMUTE_SCORE_STRAIGHT_LINE_PROXY_PENALTY_POINTS,
} from './commuteScoreNetworkRoutingBonus';
import { commuteScoreFromDurationEstimate } from './commuteScoreFromDurationEstimate';
import {
  commuteScoreFromStraightLine,
  estimateStraightLineCommuteMinutes,
} from './commuteScoreFromStraightLine';
import { fetchOrsRouteDurationMinutes, type OrsApiCredentials } from './orsDirections';
import {
  fetchTflTransitJourney,
  type TflApiCredentials,
  type TflTransitFailureCode,
  type TflTransitPlannerPreferences,
} from './tflJourney';
import { formatTflPlannerSlotSummary } from './tflPlannerSummary';

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
  /** Human-readable TfL planner time window (transit only). */
  readonly tflPlannerSummary?: string;
  /** How transit duration was aggregated from TfL’s journey list. */
  readonly tflJourneyDurationMethod?: 'median-first-three-qualifying';
  /** First qualifying journey leg summary from TfL (transit success). */
  readonly commuteTflRouteSummary?: string;
  /** HTTP status when TfL returned an error response (transit fallback). */
  readonly commuteTflHttpStatus?: number;
  /** Short TfL response body when HTTP was non-success (transit fallback). */
  readonly commuteTflHttpErrorBody?: string;
  /** Points added when TfL or OpenRouteService returned a routed journey (not straight-line proxy). */
  readonly commuteNetworkRoutingBonusApplied?: number;
  /** Points subtracted when the score uses only straight-line time (no routed duration). */
  readonly commuteStraightLineProxyPenaltyApplied?: number;
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
      const tflPlannerSummary = formatTflPlannerSlotSummary(plannerPrefs, Date.now());
      return {
        score: applyNetworkRoutingCommuteBonus(reliability.score),
        model: 'tfl-unified-api',
        commuteNetworkRoutingBonusApplied: COMMUTE_SCORE_NETWORK_ROUTING_BONUS_POINTS,
        journeyMinutes: Math.round(tflRes.minutes * 10) / 10,
        tflPlannerSummary,
        ...(tflRes.durationMethod !== undefined
          ? { tflJourneyDurationMethod: tflRes.durationMethod }
          : {}),
        ...(reliability.factor < 1 ? { commuteReliabilityFactor: reliability.factor } : {}),
        ...(alt !== undefined
          ? { commuteAlternativeJourneyMinutes: Math.round(alt * 10) / 10 }
          : {}),
        ...(tflRes.disruptionHint !== undefined
          ? { transitDisruptionHint: tflRes.disruptionHint }
          : {}),
        ...(tflRes.nationalSearchUsed === true ? { transitNationalSearchUsed: true } : {}),
        ...(tflRes.routeSummary !== undefined && tflRes.routeSummary.trim() !== ''
          ? { commuteTflRouteSummary: tflRes.routeSummary.trim() }
          : {}),
      };
    }
    const tflPlannerSummaryFallback = formatTflPlannerSlotSummary(plannerPrefs, Date.now());
    const straightEst = estimateStraightLineCommuteMinutes(
      workplace.latitude,
      workplace.longitude,
      candidateLat,
      candidateLng,
      mode,
    );
    return {
      score: applyStraightLineProxyPenalty(
        commuteScoreFromStraightLine(
          workplace.latitude,
          workplace.longitude,
          candidateLat,
          candidateLng,
          mode,
          maxM,
        ),
      ),
      model: 'tfl-fallback-straight-line',
      commuteStraightLineProxyPenaltyApplied: COMMUTE_SCORE_STRAIGHT_LINE_PROXY_PENALTY_POINTS,
      transitFailureCode: tflRes.failureCode,
      journeyMinutes: Math.round(straightEst * 10) / 10,
      tflPlannerSummary: tflPlannerSummaryFallback,
      ...(tflRes.failureCode === 'http_error'
        ? {
            commuteTflHttpStatus:
              typeof tflRes.httpStatus === 'number' && Number.isFinite(tflRes.httpStatus)
                ? tflRes.httpStatus
                : -1,
          }
        : tflRes.httpStatus !== undefined
          ? { commuteTflHttpStatus: tflRes.httpStatus }
          : {}),
      ...(tflRes.tflHttpErrorBody !== undefined && tflRes.tflHttpErrorBody.trim() !== ''
        ? { commuteTflHttpErrorBody: tflRes.tflHttpErrorBody.trim() }
        : {}),
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
        score: applyNetworkRoutingCommuteBonus(commuteScoreFromDurationEstimate(mins, maxM)),
        model: 'openrouteservice-directions',
        commuteNetworkRoutingBonusApplied: COMMUTE_SCORE_NETWORK_ROUTING_BONUS_POINTS,
        journeyMinutes: Math.round(mins * 10) / 10,
      };
    }
    const orsStraightEst = estimateStraightLineCommuteMinutes(
      workplace.latitude,
      workplace.longitude,
      candidateLat,
      candidateLng,
      mode,
    );
    return {
      score: applyStraightLineProxyPenalty(
        commuteScoreFromStraightLine(
          workplace.latitude,
          workplace.longitude,
          candidateLat,
          candidateLng,
          mode,
          maxM,
        ),
      ),
      model: 'openrouteservice-fallback-straight-line',
      commuteStraightLineProxyPenaltyApplied: COMMUTE_SCORE_STRAIGHT_LINE_PROXY_PENALTY_POINTS,
      journeyMinutes: Math.round(orsStraightEst * 10) / 10,
    };
  }

  const defaultStraightEst = estimateStraightLineCommuteMinutes(
    workplace.latitude,
    workplace.longitude,
    candidateLat,
    candidateLng,
    mode,
  );
  return {
    score: applyStraightLineProxyPenalty(
      commuteScoreFromStraightLine(
        workplace.latitude,
        workplace.longitude,
        candidateLat,
        candidateLng,
        mode,
        maxM,
      ),
    ),
    model: 'straight-line-time-estimate',
    commuteStraightLineProxyPenaltyApplied: COMMUTE_SCORE_STRAIGHT_LINE_PROXY_PENALTY_POINTS,
    journeyMinutes: Math.round(defaultStraightEst * 10) / 10,
  };
};
