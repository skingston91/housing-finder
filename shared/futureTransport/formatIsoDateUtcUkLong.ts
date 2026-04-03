/** `YYYY-MM-DD` → long UK-style label in UTC (e.g. 3 April 2026). */
export const formatIsoDateUtcUkLong = (isoDate: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate;
  }
  return new Date(`${isoDate}T00:00:00.000Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
