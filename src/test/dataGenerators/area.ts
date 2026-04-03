import type { RankedArea } from '@/domain/area/types';

let seq = 0;

export const createRankedArea = (overrides: Partial<RankedArea> = {}): RankedArea => {
  seq += 1;
  const n = seq;
  return {
    id: `area-${String(n)}`,
    displayName: `Generated Area ${String(n)}`,
    centroidLatitude: 51.5 + n * 0.001,
    centroidLongitude: -0.08 + n * 0.001,
    score: 50 + (n % 50),
    breakdown: {
      affordability: 60,
      commute: 55,
      schools: 70,
      crime: 65,
      priceTrend: 50,
      sizeFit: 50,
    },
    ...overrides,
  };
};

export const createRankedAreaList = (
  count: number,
  overrides: Partial<RankedArea> = {},
): RankedArea[] => Array.from({ length: count }, () => createRankedArea(overrides));
