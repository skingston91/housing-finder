import { crimeScoreFromWeightedMonthlyAvg } from '../crime/crimeScoreFromWeightedMonthlyAvg';
import { recentMonthsYm } from '../crime/recentMonthsYm';
import { resolveCommuteScore } from '../commute/resolveCommuteScore';
import type { TflApiCredentials } from '../commute/tflJourney';
import { fetchStreetCrimes, sumWeightedCrimeCount } from '../policeUk/streetCrimes';
import { compositeScore } from '../scoring/compositeScore';
import type { RankedAreaDto, SearchAreasRequestBody } from '../searchAreasContract';
import { scoreAffordabilitySchoolsDimensions } from './areaDimensionScores';
import { resolveSearchCandidates } from './workplaceGridCandidates';

/** Cap months per area to limit police.uk calls (each month = one request). */
const MAX_CRIME_MONTHS = 6;

export interface BuildRankedAreasOptions {
  /** When set, **transit** commute uses TfL Journey Planner; other modes stay straight-line. */
  readonly tfl?: TflApiCredentials;
}

const weightedCrimeForPoint = async (
  latitude: number,
  longitude: number,
  monthsYm: readonly string[],
  categoryWeights: Readonly<Record<string, number>>,
  fetchImpl: typeof fetch,
): Promise<{ total: number; months: number; failed: boolean }> => {
  let total = 0;
  let failed = false;
  for (const ym of monthsYm) {
    try {
      const crimes = await fetchStreetCrimes(latitude, longitude, ym, fetchImpl);
      total += sumWeightedCrimeCount(crimes, categoryWeights, 1);
    } catch {
      failed = true;
      break;
    }
  }
  return { total, months: monthsYm.length, failed };
};

/**
 * Rank candidate areas: **crime** from [data.police.uk](https://data.police.uk/);
 * **affordability** vs indicative borough medians; **commute** TfL (transit + keys) or straight-line proxy; **schools** seed proximity.
 */
export const buildRankedAreas = async (
  body: SearchAreasRequestBody,
  fetchImpl: typeof fetch,
  options?: BuildRankedAreasOptions,
): Promise<readonly RankedAreaDto[]> => {
  const monthsYm = recentMonthsYm(body.crime.windowMonths, MAX_CRIME_MONTHS);
  const { mode: candidateMode, candidates } = resolveSearchCandidates(body);

  const rows = await Promise.all(
    candidates.map(async (c) => {
      const { total, months, failed } = await weightedCrimeForPoint(
        c.latitude,
        c.longitude,
        monthsYm,
        body.crime.categoryWeights,
        fetchImpl,
      );
      const avg = months > 0 ? total / months : 0;
      const crime = failed ? 45 : crimeScoreFromWeightedMonthlyAvg(avg);
      const base = scoreAffordabilitySchoolsDimensions(body, c.latitude, c.longitude);
      const commuteRes = await resolveCommuteScore(
        body,
        c.latitude,
        c.longitude,
        fetchImpl,
        options?.tfl,
      );
      const breakdown = {
        affordability: base.affordability,
        commute: commuteRes.score,
        schools: base.schools,
        crime,
      };
      const score = compositeScore(breakdown);
      const area: RankedAreaDto = {
        id: c.id,
        displayName: c.displayName,
        centroidLatitude: c.latitude,
        centroidLongitude: c.longitude,
        score,
        breakdown,
        metadata: {
          crimeWeightedTotal: total,
          crimeMonthsRequested: body.crime.windowMonths,
          crimeMonthsUsed: monthsYm.length,
          policeUk: failed ? 'error' : 'ok',
          dataPoliceUk: 'Contains police.uk data © UK law enforcement; locations approximate.',
          candidateMode,
          affordabilityBorough: base.affordabilityBoroughName,
          affordabilityModel: 'borough-median-indicator',
          landRegistryOgl:
            'Indicative borough medians for discovery only — not transactional valuations. Contains public sector information licensed under the Open Government Licence v3.0.',
          commuteModel: commuteRes.model,
          ...(commuteRes.journeyMinutes !== undefined
            ? { commuteJourneyMinutes: commuteRes.journeyMinutes }
            : {}),
          schoolsModel: 'seed-school-distance',
        },
      };
      return area;
    }),
  );

  return [...rows].sort((a, b) => b.score - a.score);
};
