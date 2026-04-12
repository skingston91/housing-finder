import { describe, expect, it } from 'vitest';

import { commuteEnvelopeRadiusKm } from './commuteEnvelopeRadiusKm';

describe('commuteEnvelopeRadiusKm', () => {
  it('grows with max minutes for transit', () => {
    expect(commuteEnvelopeRadiusKm(40, 'transit')).toBeCloseTo(40 * 1.02, 5);
    expect(commuteEnvelopeRadiusKm(45, 'transit')).toBeGreaterThan(
      commuteEnvelopeRadiusKm(30, 'transit'),
    );
  });

  it('caps at a maximum for very long transit budgets', () => {
    expect(commuteEnvelopeRadiusKm(24 * 60, 'transit')).toBe(110);
  });
});
