import { LONDON_SCHOOL_SEEDS } from './londonSchoolSeeds';
import { LONDON_STATE_SCHOOL_ESTABLISHMENT_SAMPLE } from './londonStateSchoolEstablishmentSample';

/** Seeds plus an expanded London sample for area ranking (see `londonStateSchoolEstablishmentSample.ts`). */
export const LONDON_SCHOOL_POINTS_FOR_RANKING = [
  ...LONDON_SCHOOL_SEEDS,
  ...LONDON_STATE_SCHOOL_ESTABLISHMENT_SAMPLE,
] as const;
