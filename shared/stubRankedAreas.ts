import type { RankedAreaDto, SearchAreasRequestBody } from './searchAreasContract';

const SAMPLE_NAMES = [
  'Camden Town',
  'Islington',
  'Hackney Central',
  'Walthamstow',
  'Leytonstone',
  'Stratford',
  'Bethnal Green',
  'Clapham',
  'Peckham',
  'Greenwich',
] as const;

/** Deterministic stub areas until real adapters exist. */
export const generateStubRankedAreas = (
  body: SearchAreasRequestBody,
  count = 6,
): RankedAreaDto[] => {
  const n = Math.min(count, SAMPLE_NAMES.length);
  const seed = body.maxPriceGbp % 97;
  return Array.from({ length: n }, (_, i) => {
    const name = SAMPLE_NAMES[i];
    if (!name) {
      throw new Error('stub: index out of range');
    }
    const base = 45 + ((seed + i * 7) % 40);
    const breakdown = {
      affordability: Math.min(100, base + (i % 5)),
      commute: Math.min(100, base + 3 - i),
      schools: Math.min(100, base + (i % 8)),
      crime: Math.min(100, base + 10 - (i % 6)),
    };
    const score = Math.round(
      (breakdown.affordability + breakdown.commute + breakdown.schools + breakdown.crime) / 4,
    );
    return {
      id: `stub-${String(i)}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      displayName: name,
      centroidLatitude: 51.52 + i * 0.02,
      centroidLongitude: -0.12 - i * 0.015,
      score,
      breakdown,
      metadata: {
        stub: 1,
        maxPriceGbp: body.maxPriceGbp,
      },
    };
  });
};
