import type { RankedArea } from '@/domain/area/types';

/**
 * Copy for an `aria-live="polite"` region when the user changes the highlighted result
 * (list or map). Returns `null` when nothing should be announced.
 */
export const getSelectionAnnouncement = (
  previous: string | null | undefined,
  selectedAreaId: string | null,
  areas: readonly RankedArea[],
): string | null => {
  if (areas.length === 0) {
    return null;
  }
  if (selectedAreaId === previous) {
    return null;
  }
  if (selectedAreaId === null) {
    if (previous !== undefined && previous !== null) {
      return 'Selection cleared.';
    }
    return null;
  }
  const idx = areas.findIndex((a) => a.id === selectedAreaId);
  const area = areas[idx];
  if (area === undefined) {
    return null;
  }
  return `Selected ${area.displayName}, ${String(idx + 1)} of ${String(areas.length)}, score ${String(area.score)}.`;
};
