import { describe, expect, it } from 'vitest';

import { buildSearchAreasRequest, defaultFormState } from './buildSearchAreasRequest';

describe('buildSearchAreasRequest', () => {
  it('builds a valid body from defaults', () => {
    const body = buildSearchAreasRequest(defaultFormState());
    expect(body).not.toBeNull();
    expect(body?.maxPriceGbp).toBe(450_000);
    expect(body?.propertyTypes.length).toBeGreaterThan(0);
    expect(body?.workplace.label).toBe('Old Street');
    expect(body?.commute.mode).toBe('transit');
    expect(body?.commute.transit?.journeyPreference).toBe('least_time');
  });

  it('returns null when no property types selected', () => {
    const form = defaultFormState();
    form.propertyTypes = [];
    expect(buildSearchAreasRequest(form)).toBeNull();
  });

  it('returns null when crime JSON is invalid', () => {
    const form = defaultFormState();
    form.crimeWeightsJson = '{';
    expect(buildSearchAreasRequest(form)).toBeNull();
  });

  it('returns null when max price is empty (cleared field)', () => {
    const form = defaultFormState();
    form.maxPriceGbp = '';
    expect(buildSearchAreasRequest(form)).toBeNull();
  });

  it('returns null when max price is below minimum', () => {
    const form = defaultFormState();
    form.maxPriceGbp = 0;
    expect(buildSearchAreasRequest(form)).toBeNull();
  });

  it('returns null when only TfL planner date or only time is filled', () => {
    const form = defaultFormState();
    form.transitPlannerDate = '2026-04-01';
    form.transitPlannerTime = '';
    expect(buildSearchAreasRequest(form)).toBeNull();
  });
});
