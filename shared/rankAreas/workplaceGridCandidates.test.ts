import { describe, expect, it } from 'vitest';

import type { SearchAreasRequestBody } from '../searchAreasContract';

import { pointInLondonBounds } from './londonBounds';
import { MAX_SEARCH_CANDIDATES, resolveSearchCandidates } from './workplaceGridCandidates';

const baseBody = (): SearchAreasRequestBody => ({
  maxPriceGbp: 400_000,
  propertyTypes: ['flat'],
  workplace: { label: 'Old Street', latitude: 51.5255, longitude: -0.0875 },
  commute: { maxMinutes: 45, mode: 'transit' },
  schools: { phases: ['primary'] },
  crime: { windowMonths: 6, categoryWeights: { burglary: 1 } },
});

describe('resolveSearchCandidates', () => {
  it('uses workplace grid inside London', () => {
    const { mode, candidates } = resolveSearchCandidates(baseBody());
    expect(mode).toBe('workplace-grid');
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.length).toBeLessThanOrEqual(MAX_SEARCH_CANDIDATES);
    expect(candidates[0]?.id.startsWith('wg-')).toBe(true);
    for (const c of candidates) {
      expect(pointInLondonBounds(c.latitude, c.longitude)).toBe(true);
    }
  });

  it('falls back to fixed London list when workplace is outside bounds', () => {
    const body = {
      ...baseBody(),
      workplace: { label: 'Reading', latitude: 51.4545, longitude: -0.973 },
    };
    const { mode, candidates } = resolveSearchCandidates(body);
    expect(mode).toBe('fixed-london');
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.length).toBeLessThanOrEqual(MAX_SEARCH_CANDIDATES);
    expect(candidates[0]?.id).not.toMatch(/^wg-/);
  });
});

describe('pointInLondonBounds', () => {
  it('includes Old Street', () => {
    expect(pointInLondonBounds(51.5255, -0.0875)).toBe(true);
  });
});
