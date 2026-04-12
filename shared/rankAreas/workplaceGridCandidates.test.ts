import { describe, expect, it } from 'vitest';

import type { SearchAreasRequestBody } from '../searchAreasContract';

import { pointInSearchRegionBounds } from './londonBounds';
import {
  capSearchCandidatesStratifiedByWorkplace,
  MAX_SEARCH_CANDIDATES,
  MAX_TRANSIT_TFL_ROUTING_CANDIDATES,
  resolveSearchCandidates,
} from './workplaceGridCandidates';

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
      expect(pointInSearchRegionBounds(c.latitude, c.longitude)).toBe(true);
    }
  });

  it('falls back to fixed London list when workplace is outside the South East search region', () => {
    // Manchester lies outside SEARCH_REGION_BOUNDS; Reading would not — it sits inside the expanded South East bbox.
    const body = {
      ...baseBody(),
      workplace: { label: 'Manchester', latitude: 53.48, longitude: -2.24 },
    };
    const { mode, candidates } = resolveSearchCandidates(body);
    expect(mode).toBe('fixed-london');
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.length).toBeLessThanOrEqual(MAX_SEARCH_CANDIDATES);
    expect(candidates[0]?.id).not.toMatch(/^wg-/);
  });

  it('includes west-of-centre cells for a typical central London workplace and 45 min transit', () => {
    const body = {
      ...baseBody(),
      workplace: { label: 'Mansion House', latitude: 51.515, longitude: -0.089 },
      commute: { maxMinutes: 45, mode: 'transit' as const },
    };
    const { mode, candidates } = resolveSearchCandidates(body);
    expect(mode).toBe('workplace-grid');
    const westOfInnerLondon = candidates.filter((c) => c.longitude < -0.2);
    expect(westOfInnerLondon.length).toBeGreaterThan(0);
  });
});

describe('capSearchCandidatesStratifiedByWorkplace', () => {
  it('does not shorten lists already at or below the cap', () => {
    const wp = { latitude: 51.5, longitude: -0.1 };
    const three = [
      { id: 'a', displayName: 'A', latitude: 51.51, longitude: -0.1 },
      { id: 'b', displayName: 'B', latitude: 51.52, longitude: -0.1 },
      { id: 'c', displayName: 'C', latitude: 51.53, longitude: -0.1 },
    ];
    expect(
      capSearchCandidatesStratifiedByWorkplace(wp, three, MAX_TRANSIT_TFL_ROUTING_CANDIDATES),
    ).toHaveLength(3);
  });

  it('reduces length to max with stratified spread', () => {
    const wp = { latitude: 51.5, longitude: -0.1 };
    const many = Array.from({ length: MAX_SEARCH_CANDIDATES }, (_, i) => ({
      id: `c-${String(i)}`,
      displayName: `C${String(i)}`,
      latitude: 51.5 + i * 0.001,
      longitude: -0.1,
    }));
    const capped = capSearchCandidatesStratifiedByWorkplace(
      wp,
      many,
      MAX_TRANSIT_TFL_ROUTING_CANDIDATES,
    );
    expect(capped).toHaveLength(MAX_TRANSIT_TFL_ROUTING_CANDIDATES);
  });
});

describe('pointInSearchRegionBounds', () => {
  it('includes Old Street', () => {
    expect(pointInSearchRegionBounds(51.5255, -0.0875)).toBe(true);
  });

  it('includes Brighton (Sussex coast) for outer commuter discovery', () => {
    expect(pointInSearchRegionBounds(50.82, -0.14)).toBe(true);
  });

  it('excludes workplaces far outside the South East', () => {
    expect(pointInSearchRegionBounds(53.48, -2.24)).toBe(false);
  });
});
