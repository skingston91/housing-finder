import { describe, expect, it } from 'vitest';

import { bearingDegrees, bearingToCompass8, haversineKm } from './geo';

describe('geo', () => {
  it('haversineKm is ~0 for identical points', () => {
    expect(haversineKm(51.5, -0.1, 51.5, -0.1)).toBeLessThan(0.001);
  });

  it('haversineKm matches a known short London hop (approx)', () => {
    const km = haversineKm(51.5074, -0.1278, 51.5155, -0.092);
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(5);
  });

  it('bearingToCompass8 maps cardinal directions', () => {
    expect(bearingToCompass8(0)).toBe('N');
    expect(bearingToCompass8(90)).toBe('E');
  });

  it('bearingDegrees is defined for two distinct points', () => {
    const b = bearingDegrees(51.5, -0.1, 51.52, -0.08);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});
