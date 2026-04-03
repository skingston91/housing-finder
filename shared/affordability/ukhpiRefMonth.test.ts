import { describe, expect, it } from 'vitest';

import { refMonthMinusYears } from './ukhpiRefMonth';

describe('refMonthMinusYears', () => {
  it('subtracts one calendar year', () => {
    expect(refMonthMinusYears('2024-06', 1)).toBe('2023-06');
  });

  it('handles January across year boundary', () => {
    expect(refMonthMinusYears('2024-01', 1)).toBe('2023-01');
  });
});
