import { describe, expect, it } from 'vitest';

import { defaultFormState } from './buildSearchAreasRequest';
import {
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
});
