import { describe, expect, it } from 'vitest';

import { ukhpiAveragePriceKeyForPropertyTypes } from './ukhpiAveragePriceKey';

describe('ukhpiAveragePriceKeyForPropertyTypes', () => {
  it('uses all-dwellings average when multiple types', () => {
    expect(ukhpiAveragePriceKeyForPropertyTypes(['flat', 'terraced'])).toBe('averagePrice');
  });

  it('maps single flat to flat/maisonette HPI field', () => {
    expect(ukhpiAveragePriceKeyForPropertyTypes(['flat'])).toBe('averagePriceFlatMaisonette');
  });

  it('maps single terraced', () => {
    expect(ukhpiAveragePriceKeyForPropertyTypes(['terraced'])).toBe('averagePriceTerraced');
  });

  it('maps bungalow to detached series', () => {
    expect(ukhpiAveragePriceKeyForPropertyTypes(['bungalow'])).toBe('averagePriceDetached');
  });
});
