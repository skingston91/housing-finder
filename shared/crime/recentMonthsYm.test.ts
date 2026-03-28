import { describe, expect, it } from 'vitest';

import { recentMonthsYm } from './recentMonthsYm';

describe('recentMonthsYm', () => {
  it('returns YYYY-MM strings', () => {
    const m = recentMonthsYm(3);
    expect(m).toHaveLength(3);
    for (const s of m) {
      expect(s).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('caps at cap argument', () => {
    expect(recentMonthsYm(100, 5)).toHaveLength(5);
  });
});
