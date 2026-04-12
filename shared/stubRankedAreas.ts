import { affordabilityLandRegistryAttribution } from './affordability/affordabilityAttribution';
import { LONDON_BOROUGH_MEDIANS } from './affordability/londonBoroughMedians';
import { plannedTransportProximityForPoint } from './futureTransport/plannedTransportProximityForPoint';
import type { RankedAreaDto, SearchAreasRequestBody } from './searchAreasContract';
import { estimateStraightLineCommuteMinutes } from './commute/commuteScoreFromStraightLine';
import { compositeScore } from './scoring/compositeScore';
import {
  SCHOOLS_PERFORMANCE_COVERAGE_PCT,
  SCHOOLS_POINTS_MATCHED_BY_URN,
  SCHOOLS_POINTS_WITH_URN,
} from './schools/londonSchoolPointsForRanking';
import { scoreNonCrimeDimensions } from './rankAreas/areaDimensionScores';
import { resolveSchoolsDataAttribution } from './schools/resolveSchoolsDataAttribution';
import { resolveSchoolsPerformanceAcademicYearForMetadata } from './schools/resolveSchoolsPerformanceAcademicYearForMetadata';
import { resolveSchoolsRankingMetadataModel } from './schools/resolveSchoolsRankingMetadataModel';
import { buildMapStyleAreaHeading } from './rankAreas/buildMapStyleAreaHeading';
import { resolveSearchCandidates } from './rankAreas/workplaceGridCandidates';
import { LONDON_EPC_MEDIAN_GENERATED_ISO } from './sizeFit/londonBoroughEpcMedianFloorM2.generated';
import { normalizeSizeFitRatiosToScores } from './sizeFit/normalizeSizeFitRatiosToScores';
import {
  resolveTypicalFloorM2ForBorough,
  sizeFitAggregateModelIdForSearch,
  typicalM2CoverageForBorough,
} from './sizeFit/resolveTypicalFloorM2ForBorough';
import { sizeFitHeadroomRatio } from './sizeFit/sizeFitHeadroomRatio';

/** Fully stubbed crime; non-crime dimensions match the live ranking heuristics (no police.uk). */
export const generateStubRankedAreas = (
  body: SearchAreasRequestBody,
  count = 6,
): RankedAreaDto[] => {
  const { mode: candidateMode, candidates } = resolveSearchCandidates(body);
  const n = Math.min(count, candidates.length);
  const seed = body.maxPriceGbp % 97;
  const schoolsPerformanceAcademicYear = resolveSchoolsPerformanceAcademicYearForMetadata();
  const sizeFitMinM2 = body.sizeFit?.minFloorAreaM2;

  const prepared = Array.from({ length: n }, (_, i) => {
    const c = candidates[i];
    if (!c) {
      throw new Error('stub: index out of range');
    }
    const dims = scoreNonCrimeDimensions(body, c.latitude, c.longitude);
    return { c, dims };
  });

  const sizeFitAggregateModel =
    sizeFitMinM2 === undefined ? ('not-requested' as const) : sizeFitAggregateModelIdForSearch();
  const sizeFitRawRatios =
    sizeFitMinM2 === undefined
      ? prepared.map(() => null)
      : prepared.map((p) =>
          sizeFitHeadroomRatio(
            p.dims.affordabilityBoroughId,
            body.propertyTypes,
            sizeFitMinM2,
            (bid, t) => resolveTypicalFloorM2ForBorough(bid, t).m2,
          ),
        );
  const sizeFitScores = normalizeSizeFitRatiosToScores(sizeFitRawRatios);

  const sizeFitVals = sizeFitRawRatios.filter((v): v is number => v !== null && Number.isFinite(v));
  const sizeFitHasSpread =
    sizeFitMinM2 !== undefined &&
    sizeFitVals.length >= 2 &&
    Math.min(...sizeFitVals) < Math.max(...sizeFitVals);

  return prepared.map((row, i) => {
    const { c, dims } = row;
    const base = 45 + ((seed + i * 7) % 40);
    const crime = Math.min(100, base + 10 - (i % 6));
    const rawSizeRatio = sizeFitRawRatios[i] ?? null;
    const sf = sizeFitScores[i];
    const sizeFit = typeof sf === 'number' && Number.isFinite(sf) ? sf : 50;
    const breakdown = {
      affordability: dims.affordability,
      commute: dims.commute,
      schools: dims.schools,
      crime,
      priceTrend: 50,
      sizeFit,
    };
    const score = compositeScore({
      affordability: breakdown.affordability,
      commute: breakdown.commute,
      schools: breakdown.schools,
      crime: breakdown.crime,
    });
    const displayName =
      candidateMode === 'workplace-grid'
        ? buildMapStyleAreaHeading(body.workplace, c, LONDON_BOROUGH_MEDIANS)
        : c.displayName;
    const plannedTransport = plannedTransportProximityForPoint(c.latitude, c.longitude);
    return {
      id: `stub-${String(i)}-${c.id}`,
      displayName,
      centroidLatitude: c.latitude,
      centroidLongitude: c.longitude,
      score,
      breakdown,
      metadata: {
        stub: 1,
        policeUk: 'ok',
        crimeDataAvailable: 1,
        maxPriceGbp: body.maxPriceGbp,
        candidateMode,
        affordabilityBorough: dims.affordabilityBoroughName,
        affordabilityModel: 'borough-median-indicator',
        landRegistryOgl: affordabilityLandRegistryAttribution('static-london-borough-table'),
        commuteModel: 'straight-line-time-estimate',
        commuteMaxMinutes: body.commute.maxMinutes,
        commuteRequestMode: body.commute.mode,
        commuteJourneyMinutes:
          Math.round(
            estimateStraightLineCommuteMinutes(
              body.workplace.latitude,
              body.workplace.longitude,
              c.latitude,
              c.longitude,
              body.commute.mode,
            ) * 10,
          ) / 10,
        schoolsModel: resolveSchoolsRankingMetadataModel(),
        schoolsDataAttribution: resolveSchoolsDataAttribution(),
        schoolsPointsWithUrn: SCHOOLS_POINTS_WITH_URN,
        schoolsPointsMatchedByUrn: SCHOOLS_POINTS_MATCHED_BY_URN,
        schoolsPerformanceCoveragePct: SCHOOLS_PERFORMANCE_COVERAGE_PCT,
        ...(schoolsPerformanceAcademicYear !== undefined ? { schoolsPerformanceAcademicYear } : {}),
        futureTransportModel: plannedTransport.model,
        futureTransportNearestKm: Math.round(plannedTransport.nearestKm * 1000) / 1000,
        futureTransportNearestScheme: plannedTransport.schemeLabel,
        futureTransportNearestPointLabel: plannedTransport.pointLabel,
        futureTransportProximityScore: plannedTransport.proximityScore0To100,
        futureTransportSourceUrl: plannedTransport.sourceUrl,
        futureTransportDataLastReviewed: plannedTransport.dataLastReviewedIsoDate,
        ...(sizeFitMinM2 !== undefined
          ? {
              sizeFitModel: sizeFitAggregateModel,
              sizeFitUserMinM2: sizeFitMinM2,
              sizeFitHasSpread: sizeFitHasSpread ? 1 : 0,
              sizeFitTypicalM2Coverage: typicalM2CoverageForBorough(
                dims.affordabilityBoroughId,
                body.propertyTypes,
              ),
              sizeFitIncludedInComposite: 0,
              ...(LONDON_EPC_MEDIAN_GENERATED_ISO !== null
                ? { sizeFitEpcGeneratedAt: LONDON_EPC_MEDIAN_GENERATED_ISO }
                : {}),
              ...(rawSizeRatio !== null && Number.isFinite(rawSizeRatio)
                ? { sizeFitRawHeadroomRatio: Math.round(rawSizeRatio * 1000) / 1000 }
                : {}),
            }
          : {
              sizeFitModel: 'not-requested',
              sizeFitIncludedInComposite: 0,
            }),
      },
    };
  });
};
