import { describe, expect, it } from 'vitest';

import { resolveSchoolsPerformanceAcademicYearForMetadata } from './resolveSchoolsPerformanceAcademicYearForMetadata';

describe('resolveSchoolsPerformanceAcademicYearForMetadata', () => {
  it('returns undefined when the generated module has no academic year (default repo state)', () => {
    expect(resolveSchoolsPerformanceAcademicYearForMetadata()).toBeUndefined();
  });
});
