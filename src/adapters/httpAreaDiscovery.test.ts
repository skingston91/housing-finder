import { describe, expect, it, vi } from 'vitest';

import type { AreaSearchCriteria } from '@/domain/criteria/types';
import type { SearchAreasRequestBody, SearchAreasResponse } from '@shared/searchAreasContract';

vi.mock('@shared/rankAreas/buildMapStyleAreaHeading', () => ({
  buildMapStyleAreaHeading: vi.fn(() => '10 km W · Reading'),
}));

import { createHttpAreaDiscoveryAdapter } from './httpAreaDiscovery';

const minimalCriteria = (): AreaSearchCriteria => ({
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'HQ', latitude: 51.5, longitude: -0.1 },
  commute: { maxMinutes: 30, mode: 'driving' },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 1, categoryWeights: { burglary: 1 } },
});

describe('createHttpAreaDiscoveryAdapter', () => {
  it('maps criteria to POST body and response DTOs to domain', async () => {
    const post = vi.fn((_body: SearchAreasRequestBody): Promise<SearchAreasResponse> => {
      return Promise.resolve({
        areas: [
          {
            id: 'a1',
            displayName: 'Point A',
            centroidLatitude: 51.51,
            centroidLongitude: -0.11,
            score: 80,
            breakdown: {
              affordability: 70,
              commute: 60,
              schools: 50,
              crime: 90,
              priceTrend: 50,
              sizeFit: 50,
            },
            metadata: { policeUk: 'ok' },
          },
        ],
      });
    });

    const adapter = createHttpAreaDiscoveryAdapter(post);
    const ranked = await adapter.findRankedAreas(minimalCriteria());

    expect(post).toHaveBeenCalledTimes(1);
    const body = post.mock.calls[0]?.[0];
    expect(body?.workplace.label).toBe('HQ');
    expect(body?.crime.categoryWeights.burglary).toBe(1);

    expect(ranked.areas).toHaveLength(1);
    expect(ranked.areas[0]?.id).toBe('a1');
    expect(ranked.areas[0]?.metadata?.policeUk).toBe('ok');
  });

  it('disambiguates map headings across ranked and omitted lists so the same label is not shown twice', async () => {
    const breakdown = {
      affordability: 70,
      commute: 60,
      schools: 50,
      crime: 90,
      priceTrend: 50,
      sizeFit: 50,
    };
    const post = vi.fn(
      (_body: SearchAreasRequestBody): Promise<SearchAreasResponse> =>
        Promise.resolve({
          areas: [
            {
              id: 'main-1',
              displayName: 'x',
              centroidLatitude: 51.46,
              centroidLongitude: -0.97,
              score: 80,
              breakdown,
              metadata: { candidateMode: 'workplace-grid', policeUk: 'ok' },
            },
            {
              id: 'main-2',
              displayName: 'y',
              centroidLatitude: 51.47,
              centroidLongitude: -0.97,
              score: 75,
              breakdown,
              metadata: { candidateMode: 'workplace-grid', policeUk: 'ok' },
            },
          ],
          commuteOmittedEstimateOnlyCount: 1,
          commuteOmittedEstimateOnlyAreas: [
            {
              id: 'omit-1',
              displayName: 'z',
              centroidLatitude: 51.48,
              centroidLongitude: -0.97,
              score: 70,
              breakdown,
              metadata: { candidateMode: 'workplace-grid', policeUk: 'ok' },
            },
          ],
        }),
    );

    const adapter = createHttpAreaDiscoveryAdapter(post);
    const ranked = await adapter.findRankedAreas(minimalCriteria());

    const names = [
      ranked.areas[0]?.displayName,
      ranked.areas[1]?.displayName,
      ranked.commuteOmittedEstimateOnlyAreas?.[0]?.displayName,
    ];
    expect(new Set(names).size).toBe(3);
    for (const n of names) {
      expect(n).toMatch(/10 km W · Reading/);
    }
  });
});
