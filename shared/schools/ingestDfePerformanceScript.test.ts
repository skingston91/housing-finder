import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

describe('ingest-dfe-performance generated modules', () => {
  it('infers academic year from file name when flag is omitted', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'housing-finder-dfe-ingest-'));
    const outPath = join(tempDir, 'dfe-performance-generated.ts');
    execFileSync(
      process.execPath,
      [
        'scripts/ingest-dfe-performance.mjs',
        'scripts/fixtures/dfe-ks4-2023-24-sample.csv',
        'scripts/fixtures/dfe-ks2-sample.csv',
        outPath,
      ],
      { cwd: process.cwd(), stdio: 'pipe' },
    );
    const mapText = readFileSync(outPath, 'utf8');
    expect(mapText).toContain('"2023/24"');
  });

  it('writes map and manifest files with expected markers', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'housing-finder-dfe-ingest-'));
    const outPath = join(tempDir, 'dfe-performance-generated.ts');
    execFileSync(
      process.execPath,
      [
        'scripts/ingest-dfe-performance.mjs',
        '--academic-year',
        '2023/24',
        'scripts/fixtures/dfe-ks4-sample.csv',
        'scripts/fixtures/dfe-ks2-sample.csv',
        outPath,
      ],
      { cwd: process.cwd(), stdio: 'pipe' },
    );

    const mapText = readFileSync(outPath, 'utf8');
    expect(mapText).toContain('LONDON_SCHOOL_PERFORMANCE_ACADEMIC_YEAR');
    expect(mapText).toContain('"2023/24"');
    expect(mapText).toContain('LONDON_SCHOOL_PERFORMANCE_BY_URN');

    const manifestPath = join(tempDir, 'londonSchoolPerformanceManifest.ts');
    expect(existsSync(manifestPath)).toBe(true);
    const manifestText = readFileSync(manifestPath, 'utf8');
    expect(manifestText).toContain('LONDON_SCHOOL_PERFORMANCE_MANIFEST');
    expect(manifestText).toContain('"rowsIn"');
    expect(manifestText).toContain('"rowsMapped"');

    const manifestJsonPath = join(tempDir, 'londonSchoolPerformanceManifest.json');
    expect(existsSync(manifestJsonPath)).toBe(true);
    const manifestJson = JSON.parse(readFileSync(manifestJsonPath, 'utf8')) as {
      rowsMapped?: number;
    };
    expect(typeof manifestJson.rowsMapped).toBe('number');
  });
});
