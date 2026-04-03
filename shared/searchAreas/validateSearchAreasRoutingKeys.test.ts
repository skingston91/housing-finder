import { describe, expect, it } from 'vitest';

import type { SearchAreasRequestBody } from '../searchAreasContract';

import { validateSearchAreasRoutingKeys } from './validateSearchAreasRoutingKeys';

const baseBody = (commute: SearchAreasRequestBody['commute']): SearchAreasRequestBody => ({
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'A', latitude: 51.5, longitude: -0.1 },
  commute,
  schools: { phases: ['primary'] },
  crime: { windowMonths: 1, categoryWeights: { burglary: 1 } },
});

describe('validateSearchAreasRoutingKeys', () => {
  it('returns null when not strict', () => {
    expect(
      validateSearchAreasRoutingKeys(baseBody({ maxMinutes: 45, mode: 'transit' }), '', '', false),
    ).toBeNull();
  });

  it('returns null when strict and keys match mode', () => {
    expect(
      validateSearchAreasRoutingKeys(
        baseBody({ maxMinutes: 45, mode: 'transit' }),
        'tfl',
        '',
        true,
      ),
    ).toBeNull();
    expect(
      validateSearchAreasRoutingKeys(
        baseBody({ maxMinutes: 45, mode: 'driving' }),
        '',
        'ors',
        true,
      ),
    ).toBeNull();
  });

  it('errors when strict, transit, and TFL key missing', () => {
    const msg = validateSearchAreasRoutingKeys(
      baseBody({ maxMinutes: 45, mode: 'transit' }),
      '',
      'ors',
      true,
    );
    expect(msg).toContain('TFL_APP_KEY');
  });

  it('errors when strict, driving, and ORS key missing', () => {
    const msg = validateSearchAreasRoutingKeys(
      baseBody({ maxMinutes: 45, mode: 'walking' }),
      'tfl',
      '',
      true,
    );
    expect(msg).toContain('ORS_API_KEY');
  });
});
