import type { AreaScoreBreakdown } from '@/domain/area/types';
import {
  compositeScore as compositeScoreShared,
  type ScoreWeights,
} from '@shared/scoring/compositeScore';

export type { ScoreWeights };

export const compositeScore = (breakdown: AreaScoreBreakdown, weights?: ScoreWeights): number =>
  compositeScoreShared(breakdown, weights);
