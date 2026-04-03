import type { PropertyTypeDto } from '../searchAreasContract';

import { heuristicTypicalFloorM2ForBorough } from './heuristicTypicalFloorM2';
import {
  LONDON_BOROUGH_EPC_MEDIAN_M2,
  type EpcMedianFloorCell,
} from './londonBoroughEpcMedianFloorM2.generated';

/** Minimum certificates per borough × type cell to trust EPC median (matches ingest thresholds). */
export const EPC_MEDIAN_MIN_SAMPLE = 20;

export type TypicalFloorM2Source = 'epc-register' | 'heuristic-fallback';

export interface TypicalFloorM2Resolution {
  readonly m2: number;
  readonly source: TypicalFloorM2Source;
  readonly epcCertificateCount?: number;
}

const cellUsable = (cell: EpcMedianFloorCell | undefined): cell is EpcMedianFloorCell =>
  cell !== undefined &&
  cell.certificateCount >= EPC_MEDIAN_MIN_SAMPLE &&
  Number.isFinite(cell.medianM2) &&
  cell.medianM2 > 0;

/**
 * Typical internal floor area (m²) for scoring: **MHCLG EPC register median** when the bundled
 * table has a sufficient sample; else **inner/outer London heuristic**.
 */
export const resolveTypicalFloorM2ForBorough = (
  boroughId: string,
  propertyType: PropertyTypeDto,
): TypicalFloorM2Resolution => {
  if (propertyType === 'other') {
    return {
      m2: heuristicTypicalFloorM2ForBorough(boroughId, propertyType),
      source: 'heuristic-fallback',
    };
  }
  const cell = LONDON_BOROUGH_EPC_MEDIAN_M2[boroughId]?.[propertyType];
  if (cellUsable(cell)) {
    return {
      m2: cell.medianM2,
      source: 'epc-register',
      epcCertificateCount: cell.certificateCount,
    };
  }
  return {
    m2: heuristicTypicalFloorM2ForBorough(boroughId, propertyType),
    source: 'heuristic-fallback',
  };
};

export const sizeFitAggregateModelIdForSearch = ():
  | 'london-mhclg-epc-median-v1'
  | 'heuristic-inner-outer-london-v1' => {
  for (const byType of Object.values(LONDON_BOROUGH_EPC_MEDIAN_M2)) {
    for (const cell of Object.values(byType)) {
      if (cellUsable(cell)) {
        return 'london-mhclg-epc-median-v1';
      }
    }
  }
  return 'heuristic-inner-outer-london-v1';
};

export const typicalM2CoverageForBorough = (
  boroughId: string,
  propertyTypes: readonly PropertyTypeDto[],
): 'epc-full' | 'epc-partial' | 'heuristic-only' => {
  const resolutions = propertyTypes.map((t) => resolveTypicalFloorM2ForBorough(boroughId, t));
  const epc = resolutions.filter((r) => r.source === 'epc-register').length;
  if (epc === 0) {
    return 'heuristic-only';
  }
  if (epc === resolutions.length) {
    return 'epc-full';
  }
  return 'epc-partial';
};
