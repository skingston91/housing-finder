import { describe, expect, it } from 'vitest';

import { defaultFormState } from './buildSearchAreasRequest';
import {
  areaSearchFormsEncodeToSameQueryParam,
  decodeAreaSearchQueryParam,
  encodeAreaSearchQueryParam,
  MAX_AREA_SEARCH_Q_CHARS,
} from './areaSearchUrlState';

describe('areaSearchUrlState', () => {
  it('round-trips default form', () => {
    const form = defaultFormState();
    const enc = encodeAreaSearchQueryParam(form);
    const dec = decodeAreaSearchQueryParam(enc);
    expect(dec).not.toBeNull();
    expect(dec?.maxPriceGbp).toBe(form.maxPriceGbp);
    expect(dec?.workplaceLabel).toBe(form.workplaceLabel);
    expect(dec?.transitOmitDefaultPlannerDeparture).toBe(false);
    expect(Array.from(dec?.schoolPhases ?? []).sort()).toEqual(
      Array.from(form.schoolPhases).sort(),
    );
  });

  it('rejects oversized payloads', () => {
    expect(decodeAreaSearchQueryParam('x'.repeat(MAX_AREA_SEARCH_Q_CHARS + 1))).toBeNull();
  });

  it('compares forms by encoded q snapshot', () => {
    const a = defaultFormState();
    const b = { ...defaultFormState(), workplaceLabel: 'Elsewhere' };
    expect(areaSearchFormsEncodeToSameQueryParam(a, defaultFormState())).toBe(true);
    expect(areaSearchFormsEncodeToSameQueryParam(a, b)).toBe(false);
  });

  it('round-trips empty property types (and school phases) so URL sync does not reset mid-edit', () => {
    const form = {
      ...defaultFormState(),
      propertyTypes: [] as const,
      schoolPhases: new Set<'primary' | 'secondary' | 'sixth_form'>(),
    };
    const enc = encodeAreaSearchQueryParam(form);
    const dec = decodeAreaSearchQueryParam(enc);
    expect(dec).not.toBeNull();
    expect(dec?.propertyTypes).toEqual([]);
    expect(dec?.schoolPhases.size).toBe(0);
  });
});
