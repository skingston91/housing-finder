import { describe, expect, it } from 'vitest';

import type { RankedArea } from '@/domain/area/types';

import {
  areaProvenanceDescription,
  firstAffordabilityDiscoveryHint,
  firstDataPoliceUkAttribution,
  firstLandRegistryOglAttribution,
  firstSchoolsCoverageHint,
  firstSchoolsPerformanceYearHint,
  firstSchoolsDataAttribution,
  hasCrimeMetadataDetails,
  resultsUseStraightLineCommute,
} from './searchResultsAttribution';

const area = (metadata: RankedArea['metadata']): RankedArea => ({
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
    priceTrend: 50,
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

  it('firstAffordabilityDiscoveryHint reflects UK HPI vs static table', () => {
    expect(
      firstAffordabilityDiscoveryHint([area({ affordabilityPriceSource: 'ukhpi-linked-data' })]),
    ).toMatch(/UK HPI borough averages/);
    expect(
      firstAffordabilityDiscoveryHint([
        area({ affordabilityPriceSource: 'static-london-borough-table' }),
      ]),
    ).toMatch(/static in-repo/);
    expect(firstAffordabilityDiscoveryHint([area({ foo: 1 })])).toBeUndefined();
  });

  it('firstLandRegistryOglAttribution returns first string', () => {
    expect(
      firstLandRegistryOglAttribution([area({ foo: 1 }), area({ landRegistryOgl: 'OGL line' })]),
    ).toBe('OGL line');
  });

  it('firstSchoolsDataAttribution returns first string', () => {
    expect(
      firstSchoolsDataAttribution([
        area({ foo: 1 }),
        area({ schoolsDataAttribution: 'School locations: OGL.' }),
      ]),
    ).toBe('School locations: OGL.');
  });

  it('firstSchoolsCoverageHint formats coverage percentage and counts', () => {
    expect(
      firstSchoolsCoverageHint([
        area({ foo: 1 }),
        area({
          schoolsPerformanceCoveragePct: 61.2,
          schoolsPointsMatchedByUrn: 153,
          schoolsPointsWithUrn: 250,
        }),
      ]),
    ).toBe('Schools performance join coverage: 61.2% (153/250 URN-matched points).');
  });

  it('firstSchoolsPerformanceYearHint returns year or unset message', () => {
    expect(
      firstSchoolsPerformanceYearHint([area({ schoolsPerformanceAcademicYear: '2023/24' })]),
    ).toBe('School performance data year: 2023/24.');
    expect(firstSchoolsPerformanceYearHint([area({ foo: 1 })])).toBe(
      'School performance data year is not set.',
    );
  });

  it('areaProvenanceDescription mentions DfE URN performance when metadata says so', () => {
    expect(
      areaProvenanceDescription({
        policeUk: 'ok',
        schoolsModel: 'gias-open-data-sample-dfe-performance-urn-map',
      }),
    ).toMatch(/ingested DfE open-data CSVs/);
  });

  it('areaProvenanceDescription includes stated performance year when metadata provides it', () => {
    expect(
      areaProvenanceDescription({
        policeUk: 'ok',
        schoolsModel: 'gias-open-data-sample-dfe-performance-urn-map',
        schoolsPerformanceAcademicYear: '2023/24',
      }),
    ).toMatch(/Stated performance data year: 2023\/24/);
  });

  it('areaProvenanceDescription can mention TfL national search when metadata says so', () => {
    expect(
      areaProvenanceDescription({
        policeUk: 'ok',
        commuteModel: 'tfl-unified-api',
        commuteTflNationalSearchUsed: 1,
      }),
    ).toMatch(/national search/);
  });

  it('areaProvenanceDescription mentions commute reliability scaling when present', () => {
    expect(
      areaProvenanceDescription({
        policeUk: 'ok',
        commuteModel: 'tfl-unified-api',
        commuteReliabilityFactor: 0.892,
      }),
    ).toMatch(/scaled by 0\.892/);
  });

  it('resultsUseStraightLineCommute is true when any area uses a fallback model', () => {
    expect(resultsUseStraightLineCommute([area({ commuteModel: 'tfl-unified-api' })])).toBe(false);
    expect(
      resultsUseStraightLineCommute([area({ commuteModel: 'straight-line-time-estimate' })]),
    ).toBe(true);
    expect(
      resultsUseStraightLineCommute([area({ commuteModel: 'tfl-fallback-straight-line' })]),
    ).toBe(true);
  });

  it('areaProvenanceDescription reflects stub and police.uk', () => {
    expect(areaProvenanceDescription({ stub: 1 })).toMatch(/Demo ranking/);
    expect(areaProvenanceDescription({ policeUk: 'ok' })).toMatch(/data\.police\.uk/);
    expect(
      areaProvenanceDescription({ policeUk: 'ok', commuteModel: 'openrouteservice-directions' }),
    ).toMatch(/OpenRouteService/);
    expect(
      areaProvenanceDescription({
        policeUk: 'ok',
        commuteModel: 'openrouteservice-fallback-straight-line',
      }),
    ).toMatch(/fell back to straight-line/);
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
