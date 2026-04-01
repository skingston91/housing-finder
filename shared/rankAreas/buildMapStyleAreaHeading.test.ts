import { describe, expect, it } from 'vitest';

import { LONDON_BOROUGH_MEDIANS } from '../affordability/londonBoroughMedians';

import { buildMapStyleAreaHeading } from './buildMapStyleAreaHeading';

describe('buildMapStyleAreaHeading', () => {
  it('formats distance · named place (workplace-grid style)', () => {
    const workplace = { latitude: 51.5255, longitude: -0.0875 };
    const centroid = { latitude: 51.53, longitude: -0.08 };
    const h = buildMapStyleAreaHeading(workplace, centroid, LONDON_BOROUGH_MEDIANS);
    expect(h).toMatch(/^\d+\.\d km [NSEW]+ · .+$/);
  });
});
