import { describe, expect, it, vi } from 'vitest';

import type { AreaSearchCriteria } from '@/domain/criteria/types';
import type { SearchAreasRequestBody, SearchAreasResponse } from '@shared/searchAreasContract';

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

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.id).toBe('a1');
    expect(ranked[0]?.metadata?.policeUk).toBe('ok');
  });
});
