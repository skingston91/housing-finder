import { affordabilityLandRegistryAttribution } from './affordability/affordabilityAttribution';
import type { RankedAreaDto, SearchAreasRequestBody } from './searchAreasContract';
import { compositeScore } from './scoring/compositeScore';
import { scoreNonCrimeDimensions } from './rankAreas/areaDimensionScores';
import { resolveSearchCandidates } from './rankAreas/workplaceGridCandidates';

/** Fully stubbed crime; non-crime dimensions match the live ranking heuristics (no police.uk). */
export const generateStubRankedAreas = (
  body: SearchAreasRequestBody,
  count = 6,
): RankedAreaDto[] => {
  const { mode: candidateMode, candidates } = resolveSearchCandidates(body);
  const n = Math.min(count, candidates.length);
  const seed = body.maxPriceGbp % 97;
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
    return {
      id: `stub-${String(i)}-${c.id}`,
      displayName: c.displayName,
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
        schoolsModel: 'gias-open-data-sample-performance-seed-prototype',
      },
    };
  });
};
