import type { AreaScoreBreakdown } from '@/domain/area/types';
import {
  compositeScore as compositeScoreShared,
  compositeScoreWithPriceTrend as compositeScoreWithPriceTrendShared,
  type ScoreWeights,
} from '@shared/scoring/compositeScore';

export type { ScoreWeights };

export const compositeScore = (
  breakdown: AreaScoreBreakdown,
  options?: {
    readonly includePriceTrendInComposite?: boolean;
    readonly weights?: ScoreWeights;
  },
): number => {
  if (options?.includePriceTrendInComposite === true) {
    return compositeScoreWithPriceTrendShared(breakdown);
  }
  return compositeScoreShared(
    {
      affordability: breakdown.affordability,
      commute: breakdown.commute,
      schools: breakdown.schools,
      crime: breakdown.crime,
    },
    options?.weights,
  );
};
