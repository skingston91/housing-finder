import type { RankedArea } from '@/domain/area/types';

/** API returned a floor-area fit model (heuristic or bundled EPC aggregate). */
export const isSizeFitSecondScoreActive = (
  metadata: RankedArea['metadata'] | undefined,
): boolean => {
  const m = metadata?.sizeFitModel;
  return m === 'heuristic-inner-outer-london-v1' || m === 'london-mhclg-epc-median-v1';
};
