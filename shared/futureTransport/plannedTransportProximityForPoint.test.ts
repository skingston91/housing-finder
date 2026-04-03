import { describe, expect, it } from 'vitest';

import { LONDON_PLANNED_TRANSPORT_POINTS } from './londonPlannedTransportPoints';
import {
  PLANNED_TRANSPORT_MAX_KM_FOR_SCORE,
  plannedTransportProximityForPoint,
} from './plannedTransportProximityForPoint';

describe('plannedTransportProximityForPoint', () => {
  it('returns score 100 at exact waypoint', () => {
    const p = LONDON_PLANNED_TRANSPORT_POINTS[0];
    if (p === undefined) {
      throw new Error('fixture');
    }
    const r = plannedTransportProximityForPoint(p.latitude, p.longitude);
    expect(r.nearestKm).toBe(0);
    expect(r.proximityScore0To100).toBe(100);
    expect(r.schemeLabel.length).toBeGreaterThan(0);
    expect(r.dataLastReviewedIsoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns 0 score at or beyond max distance', () => {
    const r = plannedTransportProximityForPoint(54.0, -2.0);
    expect(r.nearestKm).toBeGreaterThan(PLANNED_TRANSPORT_MAX_KM_FOR_SCORE - 0.01);
    expect(r.proximityScore0To100).toBe(0);
  });
});
