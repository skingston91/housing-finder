import { describe, expect, it } from 'vitest';

import type { RankedAreaDto, SearchAreasRequestBody } from '../searchAreasContract';

import {
  filterRankedAreasToNetworkRoutedWhenMixed,
  routingApiExpectedForSearch,
} from './filterRankedAreasToNetworkRoutedWhenMixed';

const body = (mode: SearchAreasRequestBody['commute']['mode']): SearchAreasRequestBody => ({
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'HQ', latitude: 51.5, longitude: -0.1 },
  commute: { maxMinutes: 40, mode },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 1, categoryWeights: { burglary: 1 } },
});

const area = (id: string, commuteModel: string): RankedAreaDto => ({
  id,
  displayName: id,
  centroidLatitude: 51.5,
  centroidLongitude: -0.1,
  score: 50,
  breakdown: {
    affordability: 50,
    commute: 50,
    schools: 50,
    crime: 50,
    priceTrend: 50,
    sizeFit: 50,
  },
  metadata: { commuteModel },
});

describe('routingApiExpectedForSearch', () => {
  it('is true for transit with TfL key', () => {
    expect(routingApiExpectedForSearch(body('transit'), { tfl: { appKey: 'k' } })).toBe(true);
  });

  it('is false for transit without TfL key', () => {
    expect(routingApiExpectedForSearch(body('transit'), undefined)).toBe(false);
  });

  it('is true for driving with ORS key', () => {
    expect(
      routingApiExpectedForSearch(body('driving'), { openRouteService: { apiKey: 'k' } }),
    ).toBe(true);
  });
});

describe('filterRankedAreasToNetworkRoutedWhenMixed', () => {
  it('drops proxy rows when routing API is expected and at least one network-routed row exists', () => {
    const rows: RankedAreaDto[] = [
      area('a', 'tfl-unified-api'),
      area('b', 'tfl-fallback-straight-line'),
    ];
    const out = filterRankedAreasToNetworkRoutedWhenMixed(rows, body('transit'), {
      tfl: { appKey: 'k' },
    });
    expect(out.areas).toHaveLength(1);
    expect(out.areas[0]?.id).toBe('a');
    expect(out.omittedEstimateOnly).toBe(1);
    expect(out.omittedEstimateOnlyRows).toHaveLength(1);
    expect(out.omittedEstimateOnlyRows[0]?.id).toBe('b');
  });

  it('keeps all rows when only proxy commute models (no successful route anywhere)', () => {
    const rows: RankedAreaDto[] = [
      area('a', 'tfl-fallback-straight-line'),
      area('b', 'tfl-fallback-straight-line'),
    ];
    const out = filterRankedAreasToNetworkRoutedWhenMixed(rows, body('transit'), {
      tfl: { appKey: 'k' },
    });
    expect(out.areas).toHaveLength(2);
    expect(out.omittedEstimateOnly).toBe(0);
  });

  it('does not filter when no routing API is configured', () => {
    const rows: RankedAreaDto[] = [area('a', 'straight-line-time-estimate')];
    const out = filterRankedAreasToNetworkRoutedWhenMixed(rows, body('driving'), undefined);
    expect(out.areas).toHaveLength(1);
    expect(out.omittedEstimateOnly).toBe(0);
  });
});
