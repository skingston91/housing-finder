import type { SearchAreasRequestBody } from '../searchAreasContract';

import { commuteScoreFromDurationEstimate } from './commuteScoreFromDurationEstimate';
import { commuteScoreFromStraightLine } from './commuteScoreFromStraightLine';
import { fetchTflTransitJourneyMinutes, type TflApiCredentials } from './tflJourney';

export type CommuteModelId =
  | 'tfl-unified-api'
  | 'straight-line-time-estimate'
  | 'tfl-fallback-straight-line';

export interface CommuteScoreResult {
  readonly score: number;
  readonly model: CommuteModelId;
  /** Present when TfL returned a journey (minutes). */
  readonly journeyMinutes?: number;
}

export const resolveCommuteScore = async (
  body: SearchAreasRequestBody,
  candidateLat: number,
  candidateLng: number,
  fetchImpl: typeof fetch,
  tfl?: TflApiCredentials,
): Promise<CommuteScoreResult> => {
  const { workplace, commute } = body;
  const maxM = commute.maxMinutes;

  if (commute.mode === 'transit' && tfl !== undefined && tfl.appKey !== '') {
    const mins = await fetchTflTransitJourneyMinutes(
      workplace.latitude,
      workplace.longitude,
      candidateLat,
      candidateLng,
      fetchImpl,
      tfl,
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
        commute.mode,
        maxM,
      ),
      model: 'tfl-fallback-straight-line',
    };
  }

  return {
    score: commuteScoreFromStraightLine(
      workplace.latitude,
      workplace.longitude,
      candidateLat,
      candidateLng,
      commute.mode,
      maxM,
    ),
    model: 'straight-line-time-estimate',
  };
};
