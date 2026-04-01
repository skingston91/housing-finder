import type { SchoolPhaseDto } from '../searchAreasContract';

import type { LondonSchoolSeed } from './londonSchoolSeeds';

const PHASES: readonly SchoolPhaseDto[] = ['primary', 'secondary', 'sixth_form'];

const clamp0to100 = (n: number): number => Math.max(0, Math.min(100, n));

/**
 * For each point with a `urn`, merge official performance from `byUrn` (DfE ingest).
 * Incoming CSV values override any existing `performanceByPhase` for the same phase.
 */
export const mergePerformanceIntoSchoolSeeds = (
  points: readonly LondonSchoolSeed[],
  byUrn: Readonly<Record<string, Partial<Record<SchoolPhaseDto, number>>>>,
): readonly LondonSchoolSeed[] =>
  points.map((p) => {
    const urn = p.urn?.trim();
    if (urn === undefined || urn.length === 0) {
      return p;
    }
    const extra = byUrn[urn];
    if (extra === undefined) {
      return p;
    }
    const merged: Partial<Record<SchoolPhaseDto, number>> = { ...(p.performanceByPhase ?? {}) };
    let changed = false;
    for (const ph of PHASES) {
      const v = extra[ph];
      if (typeof v === 'number' && Number.isFinite(v)) {
        merged[ph] = clamp0to100(v);
        changed = true;
      }
    }
    if (!changed) {
      return p;
    }
    return {
      ...p,
      performanceByPhase: merged,
    };
  });
