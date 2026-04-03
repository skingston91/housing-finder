import { describe, expect, it } from 'vitest';

import { resolveDefaultLondonWeekdayMorningDeparture } from './tflDefaultLondonDeparture';

describe('resolveDefaultLondonWeekdayMorningDeparture', () => {
  it('returns Monday 08:30 when reference is that Monday morning before 08:30 London', () => {
    const ref = Date.parse('2026-04-06T06:00:00Z');
    const r = resolveDefaultLondonWeekdayMorningDeparture(ref);
    expect(r.timeHhMm).toBe('0830');
    expect(r.dateYyyyMmDd).toBe('20260406');
  });

  it('bumps to next weekday morning after 08:30 has passed London', () => {
    const ref = Date.parse('2026-04-06T12:00:00Z');
    const r = resolveDefaultLondonWeekdayMorningDeparture(ref);
    expect(r.timeHhMm).toBe('0830');
    expect(r.dateYyyyMmDd).toBe('20260407');
  });
});
