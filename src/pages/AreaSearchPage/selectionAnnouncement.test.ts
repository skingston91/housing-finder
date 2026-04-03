import { describe, expect, it } from 'vitest';

import type { RankedArea } from '@/domain/area/types';

import { getSelectionAnnouncement } from './selectionAnnouncement';

const area = (id: string, name: string, score: number): RankedArea => ({
  id,
  displayName: name,
  centroidLatitude: 51.5,
  centroidLongitude: -0.1,
  score,
  breakdown: {
    affordability: 50,
    commute: 50,
    schools: 50,
    crime: 50,
    priceTrend: 50,
    sizeFit: 50,
  },
});

describe('getSelectionAnnouncement', () => {
  const areas = [area('1', 'Alpha', 80), area('2', 'Beta', 70)];

  it('returns null when no areas', () => {
    expect(getSelectionAnnouncement(undefined, null, [])).toBeNull();
    expect(getSelectionAnnouncement('1', '1', [])).toBeNull();
  });

  it('returns null when selection unchanged', () => {
    expect(getSelectionAnnouncement('1', '1', areas)).toBeNull();
  });

  it('returns null when nothing selected and no prior selection', () => {
    expect(getSelectionAnnouncement(undefined, null, areas)).toBeNull();
    expect(getSelectionAnnouncement(null, null, areas)).toBeNull();
  });

  it('announces cleared when selection goes from id to null', () => {
    expect(getSelectionAnnouncement('1', null, areas)).toBe('Selection cleared.');
  });

  it('announces selected area with rank and score', () => {
    expect(getSelectionAnnouncement(undefined, '2', areas)).toBe(
      'Selected Beta, 2 of 2, score 70.',
    );
  });

  it('returns null when id not in areas', () => {
    expect(getSelectionAnnouncement(undefined, 'missing', areas)).toBeNull();
  });
});
