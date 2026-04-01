import { affordabilityLandRegistryAttribution } from '../affordability/affordabilityAttribution';
import { resolveLondonBoroughMedianRows } from '../affordability/resolveLondonBoroughMedianRows';
import { crimeScoreFromWeightedMonthlyAvg } from '../crime/crimeScoreFromWeightedMonthlyAvg';
import { recentMonthsYm } from '../crime/recentMonthsYm';
import { resolveCommuteScore } from '../commute/resolveCommuteScore';
import type { OrsApiCredentials } from '../commute/orsDirections';
import type { TflApiCredentials } from '../commute/tflJourney';
import { createAsyncLimiter, type AsyncLimiter } from '../async/createAsyncLimiter';
import { fetchStreetCrimes, sumWeightedCrimeCount } from '../policeUk/streetCrimes';
import { compositeScore } from '../scoring/compositeScore';
import type { RankedAreaDto, SearchAreasRequestBody } from '../searchAreasContract';
import {
  SCHOOLS_PERFORMANCE_COVERAGE_PCT,
  SCHOOLS_POINTS_MATCHED_BY_URN,
  SCHOOLS_POINTS_WITH_URN,
} from '../schools/londonSchoolPointsForRanking';
import { resolveSchoolsDataAttribution } from '../schools/resolveSchoolsDataAttribution';
import { resolveSchoolsPerformanceAcademicYearForMetadata } from '../schools/resolveSchoolsPerformanceAcademicYearForMetadata';
import { resolveSchoolsRankingMetadataModel } from '../schools/resolveSchoolsRankingMetadataModel';
import { scoreAffordabilitySchoolsDimensions } from './areaDimensionScores';
import { buildMapStyleAreaHeading } from './buildMapStyleAreaHeading';
import { resolveSearchCandidates } from './workplaceGridCandidates';

/** Cap months per area to limit police.uk calls (each month = one request). */
const MAX_CRIME_MONTHS = 6;

/** data.police.uk rate-limits bursts; keep concurrent street-crime fetches low across all candidates. */
const POLICE_UK_MAX_CONCURRENT = 3;

export interface BuildRankedAreasOptions {
  /** When set, **transit** commute uses TfL Journey Planner. */
  readonly tfl?: TflApiCredentials;
  /** When set, **driving** / **cycling** / **walking** use OpenRouteService directions (optional). */
  readonly openRouteService?: OrsApiCredentials;
  /**
   * When `true`, load latest **UK HPI** average prices per London borough (Land Registry linked-data JSON),
   * cached 6h per Lambda instance. When `false` or omitted, use static in-repo borough medians only.
   */
  readonly useLiveUkhpiMedians?: boolean;
}

const weightedCrimeForPoint = async (
  latitude: number,
  longitude: number,
  monthsYm: readonly string[],
  categoryWeights: Readonly<Record<string, number>>,
  fetchImpl: typeof fetch,
  limitPoliceUk: AsyncLimiter,
): Promise<{ total: number; months: number; failed: boolean }> => {
  let total = 0;
  let failed = false;
  for (const ym of monthsYm) {
    try {
      const crimes = await limitPoliceUk(() =>
        fetchStreetCrimes(latitude, longitude, ym, fetchImpl),
      );
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
 * **affordability** vs borough benchmarks (optional live UK HPI); **commute** TfL / ORS or straight-line; **schools** establishment sample distance.
 */
export const buildRankedAreas = async (
  body: SearchAreasRequestBody,
  fetchImpl: typeof fetch,
  options?: BuildRankedAreasOptions,
): Promise<readonly RankedAreaDto[]> => {
  const monthsYm = recentMonthsYm(body.crime.windowMonths, MAX_CRIME_MONTHS);
  const { mode: candidateMode, candidates } = resolveSearchCandidates(body);

  const medianResolution = await resolveLondonBoroughMedianRows(fetchImpl, {
    live: options?.useLiveUkhpiMedians === true,
    propertyTypes: body.propertyTypes,
  });

  const limitPoliceUk = createAsyncLimiter(POLICE_UK_MAX_CONCURRENT);
  const schoolsPerformanceAcademicYear = resolveSchoolsPerformanceAcademicYearForMetadata();

  const rows = await Promise.all(
    candidates.map(async (c) => {
      const { total, months, failed } = await weightedCrimeForPoint(
        c.latitude,
        c.longitude,
        monthsYm,
        body.crime.categoryWeights,
        fetchImpl,
        limitPoliceUk,
      );
      const avg = months > 0 ? total / months : 0;
      const crime = failed ? 45 : crimeScoreFromWeightedMonthlyAvg(avg);
      const base = scoreAffordabilitySchoolsDimensions(
        body,
        c.latitude,
        c.longitude,
        medianResolution.rows,
      );
      const commuteRes = await resolveCommuteScore(body, c.latitude, c.longitude, fetchImpl, {
        tfl: options?.tfl,
        openRouteService: options?.openRouteService,
      });
      const breakdown = {
        affordability: base.affordability,
        commute: commuteRes.score,
        schools: base.schools,
        crime,
      };
      const score = compositeScore(breakdown);
      const displayName =
        candidateMode === 'workplace-grid'
          ? buildMapStyleAreaHeading(body.workplace, c, medianResolution.rows)
          : c.displayName;
      const area: RankedAreaDto = {
        id: c.id,
        displayName,
        centroidLatitude: c.latitude,
        centroidLongitude: c.longitude,
        score,
        breakdown,
        metadata: {
          crimeWeightedTotal: total,
          crimeMonthsRequested: body.crime.windowMonths,
          crimeMonthsUsed: monthsYm.length,
          crimeWindowCapMonths: MAX_CRIME_MONTHS,
          policeUk: failed ? 'error' : 'ok',
          dataPoliceUk: 'Contains police.uk data © UK law enforcement; locations approximate.',
          candidateMode,
          affordabilityBorough: base.affordabilityBoroughName,
          affordabilityModel: 'borough-median-indicator',
          affordabilityPriceSource: medianResolution.priceSource,
          ...(medianResolution.ukhpiRefMonth !== undefined
            ? { ukhpiRefMonth: medianResolution.ukhpiRefMonth }
            : {}),
          ...(medianResolution.ukhpiPriceMeasure !== undefined
            ? { ukhpiPriceMeasure: medianResolution.ukhpiPriceMeasure }
            : {}),
          landRegistryOgl: affordabilityLandRegistryAttribution(medianResolution.priceSource),
          commuteModel: commuteRes.model,
          ...(commuteRes.journeyMinutes !== undefined
            ? { commuteJourneyMinutes: commuteRes.journeyMinutes }
            : {}),
          schoolsModel: resolveSchoolsRankingMetadataModel(),
          schoolsDataAttribution: resolveSchoolsDataAttribution(),
          schoolsPointsWithUrn: SCHOOLS_POINTS_WITH_URN,
          schoolsPointsMatchedByUrn: SCHOOLS_POINTS_MATCHED_BY_URN,
          schoolsPerformanceCoveragePct: SCHOOLS_PERFORMANCE_COVERAGE_PCT,
          ...(schoolsPerformanceAcademicYear !== undefined
            ? { schoolsPerformanceAcademicYear }
            : {}),
        },
      };
      return area;
    }),
  );

  return [...rows].sort((a, b) => b.score - a.score);
};
