import { affordabilityLandRegistryAttribution } from '../affordability/affordabilityAttribution';
import { ukhpiAveragePriceKeyForPropertyTypes } from '../affordability/ukhpiAveragePriceKey';
import { normalizeYoYPctToScores } from '../affordability/priceTrendScoreFromYoY';
import { resolveLondonBoroughMedianRows } from '../affordability/resolveLondonBoroughMedianRows';
import { resolveLondonBoroughYoYPctByBoroughId } from '../affordability/resolveLondonBoroughYoY';
import { crimeScoreFromWeightedMonthlyAvg } from '../crime/crimeScoreFromWeightedMonthlyAvg';
import { recentMonthsYm } from '../crime/recentMonthsYm';
import { resolveCommuteScore } from '../commute/resolveCommuteScore';
import { plannedTransportProximityForPoint } from '../futureTransport/plannedTransportProximityForPoint';
import type { OrsApiCredentials } from '../commute/orsDirections';
import type { TflApiCredentials } from '../commute/tflJourney';
import { createAsyncLimiter, type AsyncLimiter } from '../async/createAsyncLimiter';
import { fetchStreetCrimes, sumWeightedCrimeCount } from '../policeUk/streetCrimes';
import { compositeScore, compositeScoreWithPriceTrend } from '../scoring/compositeScore';
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
import type { SearchCandidate } from './workplaceGridCandidates';
import { resolveSearchCandidates } from './workplaceGridCandidates';

/** Cap months per area to limit police.uk calls (each month = one request). */
const MAX_CRIME_MONTHS = 6;

/** data.police.uk rate-limits bursts; keep concurrent street-crime fetches low across all candidates. */
const POLICE_UK_MAX_CONCURRENT = 3;

/** TfL fair use: cap parallel Journey Planner calls per search invocation. */
const TFL_JOURNEY_MAX_CONCURRENT = 4;

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
 * **affordability** vs borough benchmarks (optional live UK HPI); **commute** TfL / ORS or straight-line; **schools** establishment sample distance;
 * optional **price momentum** (UK HPI YoY by borough, relative among candidates).
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

  const priceKey = ukhpiAveragePriceKeyForPropertyTypes(body.propertyTypes);
  const yoyPctByBoroughId =
    options?.useLiveUkhpiMedians === true
      ? await resolveLondonBoroughYoYPctByBoroughId(
          fetchImpl,
          priceKey,
          medianResolution.ukhpiLatestObservationByBoroughId,
        )
      : new Map<string, number | null>();

  const priceTrendModel =
    medianResolution.ukhpiLatestObservationByBoroughId !== undefined &&
    medianResolution.ukhpiLatestObservationByBoroughId.size > 0
      ? 'ukhpi-borough-yoy'
      : 'unavailable';

  const includePriceTrendInComposite = body.scoring?.includePriceTrendInComposite === true;

  const limitPoliceUk = createAsyncLimiter(POLICE_UK_MAX_CONCURRENT);
  const limitTflJourney = createAsyncLimiter(TFL_JOURNEY_MAX_CONCURRENT);
  const fetchForSearch: typeof fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('api.tfl.gov.uk')) {
      return limitTflJourney(() => fetchImpl(input, init));
    }
    return fetchImpl(input, init);
  };
  const schoolsPerformanceAcademicYear = resolveSchoolsPerformanceAcademicYearForMetadata();

  const intermediate = await Promise.all(
    candidates.map(async (c: SearchCandidate) => {
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
      const commuteRes = await resolveCommuteScore(body, c.latitude, c.longitude, fetchForSearch, {
        tfl: options?.tfl,
        openRouteService: options?.openRouteService,
      });
      return {
        c,
        base,
        commuteRes,
        crime,
        total,
        monthsYmLen: monthsYm.length,
        failed,
      };
    }),
  );

  const rawYoyList = intermediate.map((row) => {
    const v = yoyPctByBoroughId.get(row.base.affordabilityBoroughId);
    return v === undefined ? null : v;
  });
  const priceTrendScores = normalizeYoYPctToScores(rawYoyList);

  const rows: RankedAreaDto[] = intermediate.map((row, i) => {
    const { c, base, commuteRes, crime, total, monthsYmLen, failed } = row;
    const plannedTransport = plannedTransportProximityForPoint(c.latitude, c.longitude);
    const rawYoyPct = rawYoyList[i] ?? null;
    const priceTrend = priceTrendScores[i] ?? 50;
    const breakdown = {
      affordability: base.affordability,
      commute: commuteRes.score,
      schools: base.schools,
      crime,
      priceTrend,
    };
    const score = includePriceTrendInComposite
      ? compositeScoreWithPriceTrend(breakdown)
      : compositeScore({
          affordability: breakdown.affordability,
          commute: breakdown.commute,
          schools: breakdown.schools,
          crime: breakdown.crime,
        });
    const displayName =
      candidateMode === 'workplace-grid'
        ? buildMapStyleAreaHeading(body.workplace, c, medianResolution.rows)
        : c.displayName;
    return {
      id: c.id,
      displayName,
      centroidLatitude: c.latitude,
      centroidLongitude: c.longitude,
      score,
      breakdown,
      metadata: {
        crimeWeightedTotal: total,
        crimeMonthsRequested: body.crime.windowMonths,
        crimeMonthsUsed: monthsYmLen,
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
        ...(commuteRes.transitFailureCode !== undefined
          ? { commuteTflFailureCode: commuteRes.transitFailureCode }
          : {}),
        ...(commuteRes.commuteAlternativeJourneyMinutes !== undefined
          ? { commuteAlternativeJourneyMinutes: commuteRes.commuteAlternativeJourneyMinutes }
          : {}),
        ...(commuteRes.transitDisruptionHint !== undefined
          ? { commuteTflDisruptionHint: commuteRes.transitDisruptionHint }
          : {}),
        ...(commuteRes.transitNationalSearchUsed === true
          ? { commuteTflNationalSearchUsed: 1 }
          : {}),
        ...(commuteRes.commuteReliabilityFactor !== undefined
          ? { commuteReliabilityFactor: commuteRes.commuteReliabilityFactor }
          : {}),
        ...(commuteRes.tflPlannerSummary !== undefined
          ? { commuteTflPlannerSummary: commuteRes.tflPlannerSummary }
          : {}),
        ...(commuteRes.tflJourneyDurationMethod !== undefined
          ? { commuteTflDurationMethod: commuteRes.tflJourneyDurationMethod }
          : {}),
        schoolsProximityModel: 'haversine-walk-estimate',
        schoolsModel: resolveSchoolsRankingMetadataModel(),
        schoolsDataAttribution: resolveSchoolsDataAttribution(),
        schoolsPointsWithUrn: SCHOOLS_POINTS_WITH_URN,
        schoolsPointsMatchedByUrn: SCHOOLS_POINTS_MATCHED_BY_URN,
        schoolsPerformanceCoveragePct: SCHOOLS_PERFORMANCE_COVERAGE_PCT,
        ...(schoolsPerformanceAcademicYear !== undefined ? { schoolsPerformanceAcademicYear } : {}),
        priceTrendModel,
        ...(rawYoyPct !== null && Number.isFinite(rawYoyPct)
          ? { priceTrendYoyPct: rawYoyPct }
          : {}),
        priceTrendIncludedInComposite: includePriceTrendInComposite ? 1 : 0,
        futureTransportModel: plannedTransport.model,
        futureTransportNearestKm: Math.round(plannedTransport.nearestKm * 1000) / 1000,
        futureTransportNearestScheme: plannedTransport.schemeLabel,
        futureTransportNearestPointLabel: plannedTransport.pointLabel,
        futureTransportProximityScore: plannedTransport.proximityScore0To100,
        futureTransportSourceUrl: plannedTransport.sourceUrl,
        futureTransportDataLastReviewed: plannedTransport.dataLastReviewedIsoDate,
      },
    };
  });

  return [...rows].sort((a, b) => b.score - a.score);
};
