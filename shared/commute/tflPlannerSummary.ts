import { mergeTflPlannerDeparturePrefs } from './tflJourney';
import type { TflTransitPlannerPreferences } from './tflJourney';

const formatYmdDisplay = (yyyyMmDd: string): string => {
  if (yyyyMmDd.length !== 8 || !/^\d{8}$/.test(yyyyMmDd)) {
    return yyyyMmDd;
  }
  return `${yyyyMmDd.slice(0, 4)}-${yyyyMmDd.slice(4, 6)}-${yyyyMmDd.slice(6, 8)}`;
};

const formatHhMmDisplay = (hhmm: string): string => {
  if (hhmm.length !== 4 || !/^\d{4}$/.test(hhmm)) {
    return hhmm;
  }
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
};

/**
 * One-line description of the TfL planner slot used for scoring (after default weekday 08:30 merge).
 * Matches what Journey Planner requests — not live departure boards.
 */
export const formatTflPlannerSlotSummary = (
  prefs: TflTransitPlannerPreferences | undefined,
  referenceMs: number,
): string => {
  const merged = mergeTflPlannerDeparturePrefs(prefs, referenceMs);
  if (merged === undefined) {
    return 'TfL Journey Planner; timetable-style planning, not live departure boards.';
  }
  if (merged.omitDefaultPlannerDeparture === true) {
    const d = merged.dateYyyyMmDd;
    const t = merged.timeHhMm;
    if (d !== undefined && d !== '' && t !== undefined && t !== '') {
      const arriveBy = merged.timeIsDeparting === false;
      return `TfL ${arriveBy ? 'arrive by' : 'depart at'} ${formatYmdDisplay(d)} ${formatHhMmDisplay(t)} (Europe/London); timetable-style planning, not live boards.`;
    }
    return 'TfL planner default clock (no weekday 08:30 injection); timetable-style planning, not live boards.';
  }
  const d = merged.dateYyyyMmDd;
  const t = merged.timeHhMm;
  if (d !== undefined && d !== '' && t !== undefined && t !== '') {
    const arriveBy = merged.timeIsDeparting === false;
    return `TfL ${arriveBy ? 'arrive by' : 'depart at'} ${formatYmdDisplay(d)} ${formatHhMmDisplay(t)} (Europe/London); timetable-style planning, not live boards.`;
  }
  return 'TfL weekday morning slot (~08:30 Europe/London); timetable-style planning, not live boards.';
};
