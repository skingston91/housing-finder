/** Completed calendar months before the current UTC month, newest first. */
export const recentMonthsYm = (count: number, cap = 12): readonly string[] => {
  const n = Math.min(Math.max(1, Math.floor(count)), cap);
  const out: string[] = [];
  const now = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    out.push(`${String(y)}-${String(m).padStart(2, '0')}`);
  }
  return out;
};
