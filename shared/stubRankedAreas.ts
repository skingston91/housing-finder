import type { RankedAreaDto, SearchAreasRequestBody } from './searchAreasContract';
import { compositeScore } from './scoring/compositeScore';
import { resolveSearchCandidates } from './rankAreas/workplaceGridCandidates';

/** Fully stubbed ranked areas (no external APIs). Prefer `buildRankedAreas` for Lambda. */
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
    const base = 45 + ((seed + i * 7) % 40);
    const breakdown = {
      affordability: Math.min(100, base + (i % 5)),
      commute: Math.min(100, base + 3 - i),
      schools: Math.min(100, base + (i % 8)),
      crime: Math.min(100, base + 10 - (i % 6)),
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
      },
    };
  });
};
