import { beforeEach, describe, expect, it } from 'vitest';

import { resetGeocodeRateLimitForTests, takeGeocodeRateLimitToken } from './geocodeRateLimit';

describe('takeGeocodeRateLimitToken', () => {
  beforeEach(() => {
    resetGeocodeRateLimitForTests();
  });

  it('allows up to maxPerWindow in one window', () => {
    const t0 = 1_000_000;
    expect(takeGeocodeRateLimitToken('a', 2, t0)).toEqual({ allowed: true });
    expect(takeGeocodeRateLimitToken('a', 2, t0 + 100)).toEqual({ allowed: true });
    const r = takeGeocodeRateLimitToken('a', 2, t0 + 200);
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('resets after window elapses', () => {
    const t0 = 5_000_000;
    expect(takeGeocodeRateLimitToken('b', 1, t0)).toEqual({ allowed: true });
    expect(takeGeocodeRateLimitToken('b', 1, t0 + 100).allowed).toBe(false);
    expect(takeGeocodeRateLimitToken('b', 1, t0 + 60_000).allowed).toBe(true);
  });

  it('skips limiting when maxPerWindow <= 0', () => {
    expect(takeGeocodeRateLimitToken('c', 0, 0).allowed).toBe(true);
    expect(takeGeocodeRateLimitToken('c', -1, 0).allowed).toBe(true);
  });
});
