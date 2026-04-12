import { describe, expect, it } from 'vitest';

import type { RankedAreaDto } from '../searchAreasContract';

import {
  applyVisibleCohortScoreRecalculation,
  keptIndicesForVisibleRows,
} from './applyVisibleCohortScoreRecalculation';

const area = (id: string, crime: number, commute: number): RankedAreaDto => ({
  id,
  displayName: id,
  centroidLatitude: 51.5,
  centroidLongitude: -0.1,
  score: 50,
  breakdown: {
    affordability: 50,
    commute,
    schools: 50,
    crime,
    priceTrend: 50,
    sizeFit: 50,
  },
  metadata: { policeUk: 'ok' },
});

describe('keptIndicesForVisibleRows', () => {
  it('maps visible rows to full row indices', () => {
    const full = [area('a', 50, 80), area('b', 60, 90)];
    const second = full[1];
    if (second === undefined) {
      throw new Error('expected second area');
    }
    const visible = [second];
    expect(keptIndicesForVisibleRows(full, visible)).toEqual([1]);
  });
});

describe('applyVisibleCohortScoreRecalculation', () => {
  it('respreads commute among visible rows', () => {
    const visible = [area('a', 50, 80), area('b', 50, 100)];
    const keptIndices = [0, 1];
    const ctx = {
      crimeInputs: [
        { weightedAvgPerMonth: 1, policeUk: 'ok' as const },
        { weightedAvgPerMonth: 2, policeUk: 'ok' as const },
      ],
      monthsYmLen: 3,
      monthsSucceededByIndex: [3, 3],
      rawYoyList: [null, null],
      sizeFitRawRatios: [null, null],
      commuteRawScores: [80, 100],
      includePriceTrendInComposite: false,
      priceTrendModel: 'unavailable',
    };
    const out = applyVisibleCohortScoreRecalculation(visible, keptIndices, ctx);
    expect(out[0]?.breakdown.commute).toBe(0);
    expect(out[1]?.breakdown.commute).toBe(100);
    expect(out[0]?.metadata?.commuteNormalizedAmongVisible).toBe(1);
  });
});
