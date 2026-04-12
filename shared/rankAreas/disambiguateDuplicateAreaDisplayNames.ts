/**
 * When two candidates resolve to the same map-style heading (same distance label + neighbourhood),
 * append compact coordinates so rows are distinguishable without implying a data bug.
 */
export const disambiguateDuplicateAreaDisplayNames = <
  T extends {
    readonly displayName: string;
    readonly centroidLatitude: number;
    readonly centroidLongitude: number;
  },
>(
  rows: readonly T[],
): T[] => {
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.displayName, (counts.get(r.displayName) ?? 0) + 1);
  }
  return rows.map((r) => {
    if ((counts.get(r.displayName) ?? 0) <= 1) {
      return r;
    }
    const suffix = ` (${r.centroidLatitude.toFixed(3)}, ${r.centroidLongitude.toFixed(3)})`;
    return { ...r, displayName: `${r.displayName}${suffix}` };
  });
};
