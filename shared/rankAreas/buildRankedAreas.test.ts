import { describe, expect, it, vi } from 'vitest';

import type { SearchAreasRequestBody } from '../searchAreasContract';

import { buildRankedAreas } from './buildRankedAreas';

const minimalBody: SearchAreasRequestBody = {
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'HQ', latitude: 51.5, longitude: -0.1 },
  commute: { maxMinutes: 30, mode: 'driving' },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 1, categoryWeights: { burglary: 2 } },
};

describe('buildRankedAreas', () => {
  it('ranks areas using mocked police.uk responses', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([{ category: 'burglary' }, { category: 'anti-social-behaviour' }]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const areas = await buildRankedAreas(minimalBody, fetchImpl);
    expect(areas.length).toBeGreaterThan(0);
    const first = areas[0];
    expect(first).toBeDefined();
    expect(first?.score).toBeTypeOf('number');
    expect(first?.displayName).toMatch(/.+/);
    expect(first?.metadata?.policeUk).toBe('ok');
    expect(fetchImpl.mock.calls.length).toBeGreaterThan(0);
  });
});
