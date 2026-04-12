import { describe, expect, it } from 'vitest';

import { formatCommuteJourneyDurationForDisplay } from './formatCommuteJourneyDurationForDisplay';

describe('formatCommuteJourneyDurationForDisplay', () => {
  it('uses seconds when under one minute', () => {
    expect(formatCommuteJourneyDurationForDisplay(0.4)).toBe('~24 sec');
    expect(formatCommuteJourneyDurationForDisplay(0.95)).toBe('~57 sec');
  });

  it('uses minutes at or above one minute', () => {
    expect(formatCommuteJourneyDurationForDisplay(1)).toBe('~1 min');
    expect(formatCommuteJourneyDurationForDisplay(20)).toBe('~20 min');
    expect(formatCommuteJourneyDurationForDisplay(27.5)).toBe('~27.5 min');
  });
});
