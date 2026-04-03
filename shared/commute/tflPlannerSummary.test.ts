import { describe, expect, it } from 'vitest';

import { formatTflPlannerSlotSummary } from './tflPlannerSummary';

describe('formatTflPlannerSlotSummary', () => {
  it('describes default weekday slot when date/time are injected by merge', () => {
    const s = formatTflPlannerSlotSummary(undefined, Date.now());
    expect(s).toContain('08:30');
    expect(s).toMatch(/timetable|TfL/i);
  });

  it('describes omit-default behaviour without date', () => {
    const s = formatTflPlannerSlotSummary({ omitDefaultPlannerDeparture: true }, Date.now());
    expect(s).toMatch(/no weekday 08:30|default clock/i);
  });

  it('formats explicit date and time', () => {
    const s = formatTflPlannerSlotSummary(
      {
        dateYyyyMmDd: '20260415',
        timeHhMm: '0930',
        timeIsDeparting: true,
      },
      Date.now(),
    );
    expect(s).toContain('2026-04-15');
    expect(s).toContain('09:30');
  });
});
