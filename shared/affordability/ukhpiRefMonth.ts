/** UK HPI `refMonth` strings are `yyyy-MM` (calendar month). */

export const refMonthMinusYears = (ym: string, years: number): string => {
  const parts = ym.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  if (y === undefined || m === undefined || !Number.isFinite(y) || !Number.isFinite(m)) {
    return ym;
  }
  const d = new Date(Date.UTC(y, m - 1 - years * 12, 1));
  return `${String(d.getUTCFullYear())}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
