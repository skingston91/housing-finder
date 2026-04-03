import { describe, expect, it } from 'vitest';

import { formatIsoDateUtcUkLong } from './formatIsoDateUtcUkLong';

describe('formatIsoDateUtcUkLong', () => {
  it('formats a valid ISO calendar date', () => {
    expect(formatIsoDateUtcUkLong('2026-04-03')).toBe('3 April 2026');
  });

  it('returns the input unchanged when not YYYY-MM-DD', () => {
    expect(formatIsoDateUtcUkLong('bad')).toBe('bad');
  });
});
