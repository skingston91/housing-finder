import { affordabilityLandRegistryAttribution } from './affordability/affordabilityAttribution';
import { LONDON_BOROUGH_MEDIANS } from './affordability/londonBoroughMedians';
import type { RankedAreaDto, SearchAreasRequestBody } from './searchAreasContract';
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

/** Fully stubbed crime; non-crime dimensions match the live ranking heuristics (no police.uk). */
export const generateStubRankedAreas = (
  body: SearchAreasRequestBody,
  count = 6,
): RankedAreaDto[] => {
  const { mode: candidateMode, candidates } = resolveSearchCandidates(body);
  const n = Math.min(count, candidates.length);
  const seed = body.maxPriceGbp % 97;
  const schoolsPerformanceAcademicYear = resolveSchoolsPerformanceAcademicYearForMetadata();
  return Array.from({ length: n }, (_, i) => {
    const c = candidates[i];
    if (!c) {
      throw new Error('stub: index out of range');
    }
    const dims = scoreNonCrimeDimensions(body, c.latitude, c.longitude);
    const base = 45 + ((seed + i * 7) % 40);
    const crime = Math.min(100, base + 10 - (i % 6));
    const breakdown = {
      affordability: dims.affordability,
      commute: dims.commute,
      schools: dims.schools,
      crime,
    };
    const score = compositeScore(breakdown);
    const displayName =
      candidateMode === 'workplace-grid'
        ? buildMapStyleAreaHeading(body.workplace, c, LONDON_BOROUGH_MEDIANS)
        : c.displayName;
    return {
      id: `stub-${String(i)}-${c.id}`,
      displayName,
      centroidLatitude: c.latitude,
      centroidLongitude: c.longitude,
      score,
      breakdown,
      metadata: {
        stub: 1,
        maxPriceGbp: body.maxPriceGbp,
        candidateMode,
        affordabilityBorough: dims.affordabilityBoroughName,
        affordabilityModel: 'borough-median-indicator',
        landRegistryOgl: affordabilityLandRegistryAttribution('static-london-borough-table'),
        commuteModel: 'straight-line-time-estimate',
        schoolsModel: resolveSchoolsRankingMetadataModel(),
        schoolsDataAttribution: resolveSchoolsDataAttribution(),
        schoolsPointsWithUrn: SCHOOLS_POINTS_WITH_URN,
        schoolsPointsMatchedByUrn: SCHOOLS_POINTS_MATCHED_BY_URN,
        schoolsPerformanceCoveragePct: SCHOOLS_PERFORMANCE_COVERAGE_PCT,
        ...(schoolsPerformanceAcademicYear !== undefined ? { schoolsPerformanceAcademicYear } : {}),
      },
    };
  });
};
