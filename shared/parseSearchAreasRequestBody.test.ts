import { describe, expect, it } from 'vitest';

import { parseSearchAreasRequestBody } from './parseSearchAreasRequestBody';

describe('parseSearchAreasRequestBody', () => {
  it('accepts a minimal valid body', () => {
    const raw = {
      maxPriceGbp: 400_000,
      propertyTypes: ['flat'],
      workplace: { label: 'HQ', latitude: 51.5, longitude: -0.1 },
      commute: { maxMinutes: 30, mode: 'driving' },
      schools: { phases: ['primary'] },
      crime: { windowMonths: 12, categoryWeights: { x: 1 } },
    };
    const r = parseSearchAreasRequestBody(raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.maxPriceGbp).toBe(400_000);
    }
  });

  it('rejects commute.transit when only date or only time is set', () => {
    const base = {
      maxPriceGbp: 400_000,
      propertyTypes: ['flat'],
      workplace: { label: 'HQ', latitude: 51.5, longitude: -0.1 },
      schools: { phases: ['primary'] },
      crime: { windowMonths: 12, categoryWeights: { x: 1 } },
    };
    const onlyDate = parseSearchAreasRequestBody({
      ...base,
      commute: {
        maxMinutes: 30,
        mode: 'transit',
        transit: { dateYyyyMmDd: '20260401' },
      },
    });
    expect(onlyDate.ok).toBe(false);
    const both = parseSearchAreasRequestBody({
      ...base,
      commute: {
        maxMinutes: 30,
        mode: 'transit',
        transit: {
          dateYyyyMmDd: '20260401',
          timeHhMm: '0830',
          timeIsDeparting: false,
          maxWalkingMinutes: 20,
          maxTransferMinutes: 15,
          atMostOnePublicTransportLeg: true,
        },
      },
    });
    expect(both.ok).toBe(true);
    if (both.ok) {
      expect(both.value.commute.transit?.timeHhMm).toBe('0830');
      expect(both.value.commute.transit?.timeIsDeparting).toBe(false);
      expect(both.value.commute.transit?.maxWalkingMinutes).toBe(20);
      expect(both.value.commute.transit?.atMostOnePublicTransportLeg).toBe(true);
    }
  });

  it('parses optional commute.transit for TfL tuning', () => {
    const raw = {
      maxPriceGbp: 400_000,
      propertyTypes: ['flat'],
      workplace: { label: 'HQ', latitude: 51.5, longitude: -0.1 },
      commute: {
        maxMinutes: 30,
        mode: 'transit',
        transit: {
          journeyPreference: 'least_interchange',
          includeAlternativeRoutes: true,
          avoidLineIds: ['victoria'],
          requireMultipleJourneys: true,
          atMostOneRailLeg: true,
        },
      },
      schools: { phases: ['primary'] },
      crime: { windowMonths: 12, categoryWeights: { x: 1 } },
    };
    const r = parseSearchAreasRequestBody(raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.commute.transit?.journeyPreference).toBe('least_interchange');
      expect(r.value.commute.transit?.includeAlternativeRoutes).toBe(true);
      expect(r.value.commute.transit?.avoidLineIds).toEqual(['victoria']);
      expect(r.value.commute.transit?.requireMultipleJourneys).toBe(true);
      expect(r.value.commute.transit?.atMostOneRailLeg).toBe(true);
    }
  });

  it('rejects empty property types', () => {
    const r = parseSearchAreasRequestBody({
      maxPriceGbp: 1,
      propertyTypes: [],
      workplace: { label: 'HQ', latitude: 0, longitude: 0 },
      commute: { maxMinutes: 1, mode: 'walking' },
      schools: { phases: ['primary'] },
      crime: { windowMonths: 1, categoryWeights: {} },
    });
    expect(r.ok).toBe(false);
  });
});
