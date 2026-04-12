import { describe, expect, it } from 'vitest';

import {
  parseCommuteTflHttpStatusFromMetadata,
  rankedAreaDtoToDomain,
} from './mapSearchAreasContract';

import type { RankedAreaDto } from '@shared/searchAreasContract';

describe('parseCommuteTflHttpStatusFromMetadata', () => {
  it('returns numeric status as-is', () => {
    expect(parseCommuteTflHttpStatusFromMetadata({ commuteTflHttpStatus: 403 })).toBe(403);
  });

  it('coerces numeric strings to numbers', () => {
    expect(parseCommuteTflHttpStatusFromMetadata({ commuteTflHttpStatus: '429' })).toBe(429);
  });

  it('returns undefined when absent or not parseable', () => {
    expect(parseCommuteTflHttpStatusFromMetadata({})).toBeUndefined();
    expect(parseCommuteTflHttpStatusFromMetadata({ commuteTflHttpStatus: 'nope' })).toBeUndefined();
  });
});

describe('rankedAreaDtoToDomain', () => {
  it('normalizes string commuteTflHttpStatus to a number on metadata', () => {
    const dto: RankedAreaDto = {
      id: 'a',
      displayName: 'A',
      centroidLatitude: 1,
      centroidLongitude: 2,
      score: 50,
      breakdown: {
        affordability: 1,
        commute: 2,
        schools: 3,
        crime: 4,
        priceTrend: 5,
        sizeFit: 6,
      },
      metadata: { commuteTflHttpStatus: '401' },
    };
    const area = rankedAreaDtoToDomain(dto);
    expect(area.metadata?.commuteTflHttpStatus).toBe(401);
  });
});
