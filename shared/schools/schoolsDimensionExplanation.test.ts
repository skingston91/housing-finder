import { describe, expect, it } from 'vitest';

import { schoolsDimensionExplanationLine } from './schoolsDimensionExplanation';

describe('schoolsDimensionExplanationLine', () => {
  it('describes DfE URN map with year and coverage', () => {
    expect(
      schoolsDimensionExplanationLine({
        schoolsModel: 'gias-open-data-sample-dfe-performance-urn-map',
        schoolsPerformanceAcademicYear: '2023/24',
        schoolsPerformanceCoveragePct: 61.2,
        schoolsPointsMatchedByUrn: 10,
        schoolsPointsWithUrn: 16,
      }),
    ).toMatch(/Performance release: 2023\/24/);
    expect(
      schoolsDimensionExplanationLine({
        schoolsModel: 'gias-open-data-sample-dfe-performance-urn-map',
        schoolsPerformanceAcademicYear: '2023/24',
        schoolsPerformanceCoveragePct: 61.2,
        schoolsPointsMatchedByUrn: 10,
        schoolsPointsWithUrn: 16,
      }),
    ).toMatch(/61%/);
  });

  it('describes seed prototype model', () => {
    expect(
      schoolsDimensionExplanationLine({
        schoolsModel: 'gias-open-data-sample-performance-seed-prototype',
      }),
    ).toMatch(/illustrative performance seeds/);
  });

  it('returns null for unknown model', () => {
    expect(schoolsDimensionExplanationLine({ schoolsModel: 'unknown' })).toBeNull();
  });
});
