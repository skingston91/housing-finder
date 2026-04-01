#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const DEFAULT_PATH = 'shared/schools/londonSchoolPerformanceManifest.json';
const DEFAULT_MIN_COVERAGE = 30;
const DEFAULT_MAX_DROPPED_PCT = 80;

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const parseArgs = (argv) => {
  let path = DEFAULT_PATH;
  let minCoverage = DEFAULT_MIN_COVERAGE;
  let maxDroppedPct = DEFAULT_MAX_DROPPED_PCT;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--path') {
      path = argv[i + 1] ?? path;
      i += 1;
      continue;
    }
    if (a === '--min-coverage') {
      minCoverage = num(argv[i + 1], minCoverage);
      i += 1;
      continue;
    }
    if (a === '--max-dropped-no-mapped-pct') {
      maxDroppedPct = num(argv[i + 1], maxDroppedPct);
      i += 1;
      continue;
    }
  }
  return { path, minCoverage, maxDroppedPct };
};

const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);

const main = () => {
  const { path, minCoverage, maxDroppedPct } = parseArgs(process.argv.slice(2));
  if (!existsSync(path)) {
    console.error(
      JSON.stringify({
        component: 'dfe_manifest_check',
        path,
        skipped: true,
        skipReason: 'manifest_json_missing',
      }),
    );
    process.exit(0);
  }
  const raw = readFileSync(path, 'utf8');
  /** @type {{
   * urnCount?: number; rowsWithUrn?: number; rowsMapped?: number; rowsDroppedNoMappedScore?: number;
   * schoolsPerformanceAcademicYear?: string; generatedAtIso?: string;
   * candidateUnmappedMetricColumns?: Record<string, number>;
   * }} */
  const m = JSON.parse(raw);

  const rowsWithUrn = num(m.rowsWithUrn, 0);
  const rowsMapped = num(m.rowsMapped, 0);
  const droppedNoMapped = num(m.rowsDroppedNoMappedScore, 0);
  const coverage = pct(rowsMapped, rowsWithUrn);
  const droppedPct = pct(droppedNoMapped, rowsWithUrn);
  const topUnknown = Object.entries(m.candidateUnmappedMetricColumns ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const report = {
    component: 'dfe_manifest_check',
    path,
    generatedAtIso: m.generatedAtIso,
    schoolsPerformanceAcademicYear: m.schoolsPerformanceAcademicYear,
    urnCount: m.urnCount,
    rowsWithUrn,
    rowsMapped,
    rowsDroppedNoMappedScore: droppedNoMapped,
    coveragePct: Math.round(coverage * 10) / 10,
    droppedNoMappedPct: Math.round(droppedPct * 10) / 10,
    thresholds: { minCoverage, maxDroppedNoMappedPct: maxDroppedPct },
    topCandidateUnmappedMetricColumns: topUnknown,
  };
  if (rowsWithUrn === 0) {
    console.error(JSON.stringify({ ...report, skipped: true, skipReason: 'no_rows_with_urn' }));
    process.exit(0);
  }

  console.error(JSON.stringify(report));

  const failures = [];
  if (coverage < minCoverage) {
    failures.push(`coverage ${coverage.toFixed(1)}% < min ${minCoverage}%`);
  }
  if (droppedPct > maxDroppedPct) {
    failures.push(`dropped-no-mapped ${droppedPct.toFixed(1)}% > max ${maxDroppedPct}%`);
  }
  if (rowsWithUrn > 0 && rowsMapped === 0) {
    failures.push('rowsMapped is 0 despite rowsWithUrn > 0');
  }
  if (failures.length > 0) {
    console.error(`dfe-manifest-check failed: ${failures.join('; ')}`);
    process.exit(2);
  }
};

main();
