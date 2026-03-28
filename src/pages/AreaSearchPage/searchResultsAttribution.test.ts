import { describe, expect, it } from 'vitest';

import type { RankedAreaDto } from '@shared/searchAreasContract';

import {
  areaProvenanceDescription,
  firstDataPoliceUkAttribution,
  hasCrimeMetadataDetails,
} from './searchResultsAttribution';

const area = (metadata: RankedAreaDto['metadata']): RankedAreaDto => ({
  id: 'a',
  displayName: 'Test',
  centroidLatitude: 51.5,
  centroidLongitude: -0.1,
  score: 70,
  breakdown: {
    affordability: 50,
    commute: 50,
    schools: 50,
    crime: 50,
  },
  metadata,
});

describe('searchResultsAttribution', () => {
  it('firstDataPoliceUkAttribution returns first string', () => {
    expect(
      firstDataPoliceUkAttribution([
        area({ foo: 1 }),
        area({ dataPoliceUk: 'Contains police.uk' }),
      ]),
    ).toBe('Contains police.uk');
  });

  it('areaProvenanceDescription reflects stub and police.uk', () => {
    expect(areaProvenanceDescription({ stub: 1 })).toMatch(/Demo ranking/);
    expect(areaProvenanceDescription({ policeUk: 'ok' })).toMatch(/data\.police\.uk/);
    expect(areaProvenanceDescription({ policeUk: 'ok', candidateMode: 'workplace-grid' })).toMatch(
      /grid around your workplace/,
    );
    expect(areaProvenanceDescription({ policeUk: 'ok', candidateMode: 'fixed-london' })).toMatch(
      /fixed London/,
    );
    expect(areaProvenanceDescription({ policeUk: 'error' })).toMatch(/fallback/);
  });

  it('hasCrimeMetadataDetails excludes stub rows', () => {
    expect(hasCrimeMetadataDetails({ stub: 1, crimeWeightedTotal: 9 })).toBe(false);
    expect(hasCrimeMetadataDetails({ policeUk: 'ok' })).toBe(true);
  });
});
