import { describe, expect, it } from 'vitest';

import { LONDON_BOROUGH_MEDIANS } from '../affordability/londonBoroughMedians';

import { nearestMapAreaDisplayName } from './nearestMapAreaLabel';

describe('nearestMapAreaDisplayName', () => {
  it('prefers a neighbourhood-scale label near Old Street (TfL-scale centroid)', () => {
    const name = nearestMapAreaDisplayName(51.5255, -0.0875, LONDON_BOROUGH_MEDIANS);
    expect(name).toBe('Shoreditch');
  });

  it('uses a seed for Stratford centre', () => {
    expect(nearestMapAreaDisplayName(51.541, -0.0034, LONDON_BOROUGH_MEDIANS)).toBe('Stratford');
  });

  it('falls back to borough when seeds are forced out of range', () => {
    const name = nearestMapAreaDisplayName(51.5255, -0.0875, LONDON_BOROUGH_MEDIANS, 0.25);
    expect(name).not.toBe('Shoreditch');
    expect(LONDON_BOROUGH_MEDIANS.some((b) => b.boroughName === name)).toBe(true);
  });
});
