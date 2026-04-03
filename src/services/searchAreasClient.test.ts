import { describe, expect, it, vi } from 'vitest';

import type { SearchAreasRequestBody, SearchAreasResponse } from '@shared/searchAreasContract';

import { postSearchAreas } from './searchAreasClient';

const minimalBody: SearchAreasRequestBody = {
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'Test', latitude: 51.5, longitude: -0.1 },
  commute: { maxMinutes: 30, mode: 'driving' },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 12, categoryWeights: { x: 1 } },
};

describe('postSearchAreas', () => {
  it('returns parsed areas on success', async () => {
    const payload: SearchAreasResponse = {
      areas: [
        {
          id: 'a1',
          displayName: 'Stub',
          centroidLatitude: 51,
          centroidLongitude: -0.1,
          score: 70,
          breakdown: {
            affordability: 70,
            commute: 70,
            schools: 70,
            crime: 70,
            priceTrend: 50,
          },
        },
      ],
    };
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(payload)),
    });

    const res = await postSearchAreas(minimalBody, fetchImpl);
    expect(res.areas).toHaveLength(1);
    expect(res.areas[0]?.displayName).toBe('Stub');
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/search-areas',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws with server error message', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ error: 'bad' })),
    });

    await expect(postSearchAreas(minimalBody, fetchImpl)).rejects.toThrow('bad');
  });
});
