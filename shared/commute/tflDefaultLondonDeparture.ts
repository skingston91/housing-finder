/**
 * Default **depart at Weekday 08:30 Europe/London** when the client sends no planner date/time,
 * so journeys reflect a typical commuter slot rather than “right now”.
 */

const LONDON = 'Europe/London';

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: LONDON,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: LONDON,
  weekday: 'short',
});

const hmFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: LONDON,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const londonYmd = (ms: number): string => ymdFormatter.format(new Date(ms));

const londonWeekdayShortAtYmdNoon = (ymd: string): string => {
  const ms = Date.parse(`${ymd}T12:00:00Z`);
  return weekdayFormatter.format(new Date(ms));
};

/** First instant (ms) on that London calendar day when local clock is 08:30, or null. */
const instantLondon0830OnYmd = (ymd: string): number | null => {
  const base = Date.parse(`${ymd}T00:00:00Z`);
  if (!Number.isFinite(base)) {
    return null;
  }
  for (let k = 0; k < 26 * 60; k += 1) {
    const ms = base + k * 60 * 1000;
    const parts = hmFormatter.formatToParts(new Date(ms));
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? NaN);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? NaN);
    if (hour === 8 && minute === 30) {
      return ms;
    }
  }
  return null;
};

const addOneCalendarDay = (ymd: string): string => {
  const parts = ymd.split('-');
  if (parts.length !== 3) {
    throw new Error(`addOneCalendarDay: invalid ymd ${ymd}`);
  }
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (![y, m, d].every((n) => Number.isFinite(n))) {
    throw new Error(`addOneCalendarDay: invalid ymd ${ymd}`);
  }
  const u = new Date(Date.UTC(y, m - 1, d + 1));
  const y2 = u.getUTCFullYear();
  const m2 = String(u.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(u.getUTCDate()).padStart(2, '0');
  return `${String(y2)}-${m2}-${d2}`;
};

/**
 * Next **Mon–Fri** London date on/after `referenceMs` where **08:30 local** is **not before** `referenceMs`.
 */
export const resolveDefaultLondonWeekdayMorningDeparture = (
  referenceMs: number,
): { dateYyyyMmDd: string; timeHhMm: string } => {
  let ymd = londonYmd(referenceMs);
  for (let i = 0; i < 14; i += 1) {
    const wd = londonWeekdayShortAtYmdNoon(ymd);
    if (wd !== 'Sat' && wd !== 'Sun') {
      const t0830 = instantLondon0830OnYmd(ymd);
      if (t0830 !== null && t0830 >= referenceMs) {
        return { dateYyyyMmDd: ymd.replace(/-/g, ''), timeHhMm: '0830' };
      }
    }
    ymd = addOneCalendarDay(ymd);
  }
  throw new Error('resolveDefaultLondonWeekdayMorningDeparture: no weekday morning slot');
};
