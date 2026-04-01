#!/usr/bin/env node
/**
 * Ingest official DfE / performance-table CSVs (school_urn + measures) and emit
 * `shared/schools/londonSchoolPerformanceByUrn.ts`.
 *
 * Heuristics (column names are matched case-insensitively on normalised keys):
 * - URN: `school_urn`, `urn`, or keys containing both `school` and `urn`.
 * - KS4-style: `progress8_average` (or first `progress8*average` not scoped to ebacc/element buckets)
 *   → maps to `secondary` and `sixth_form` (0–100) via 50 + value × 25, clamped.
 * - KS2-style: numeric columns whose names suggest reading/maths/writing “expected standard” /
 *   “meeting expected” percentages (0–100) → averaged → `primary`.
 *
 * Academic year (optional, for metadata / UI):
 * - `--academic-year 2023/24` or `--academic-year=2023-24` (any short label you want shown).
 * - If omitted, filenames are scanned for patterns like `2023-24`, `2023_24`, `2023-2024` in basenames.
 *
 * Usage:
 *   node scripts/ingest-dfe-performance.mjs [--academic-year LABEL] <a.csv> [b.csv ...] [out.ts]
 *
 * If the last path argument ends with `.ts`, it is the output path; otherwise all path args are CSV inputs
 * and the default output is `shared/schools/londonSchoolPerformanceByUrn.ts`.
 */
import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** @param {Record<string, string>} row */
const findCol = (row, predicate) => {
  for (const [k, v] of Object.entries(row)) {
    if (predicate(norm(k))) {
      return { key: k, value: v };
    }
  }
  return null;
};

const num = (s) => {
  const n = Number.parseFloat(String(s).replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

const clamp = (n) => Math.max(0, Math.min(100, n));

/** Progress 8 national expectation ~0; map to a 0–100 display score. */
const progress8ToScore = (v) => clamp(50 + v * 25);

/** @param {string[]} basenames */
export const inferAcademicYearFromBasenames = (basenames) => {
  for (const b of basenames) {
    let m = b.match(/(20\d{2})[-_/](20\d{2})(?=\D|$)/);
    if (m !== null) {
      const y1 = Number(m[1]);
      const y2 = Number(m[2]);
      if (Number.isFinite(y2) && y2 > y1) {
        return `${m[1]}/${String(y2).slice(-2)}`;
      }
    }
    m = b.match(/(20\d{2})[-_/](\d{2})(?=\D|$)/);
    if (m === null) {
      continue;
    }
    const y1 = m[1];
    const y2Full = Number(`${y1.slice(0, 2)}${m[2]}`);
    if (!Number.isFinite(y2Full) || y2Full <= Number(y1)) {
      continue;
    }
    return `${y1}/${String(y2Full).slice(-2)}`;
  }
  return null;
};

/**
 * @param {string[]} argv process.argv.slice(2)
 * @returns {{ academicYearFlag: string | null, paths: string[] }}
 */
const parseCli = (argv) => {
  /** @type {string[]} */
  const paths = [];
  let academicYearFlag = null;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === undefined) {
      break;
    }
    if (a === '--academic-year') {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        console.error('ingest-dfe-performance: --academic-year requires a value');
        process.exit(1);
      }
      academicYearFlag = next;
      i += 1;
      continue;
    }
    if (a.startsWith('--academic-year=')) {
      academicYearFlag = a.slice('--academic-year='.length);
      continue;
    }
    paths.push(a);
  }
  return { academicYearFlag, paths };
};

export const sanitizeAcademicYearLabel = (raw) => {
  const t = String(raw).trim();
  if (t.length === 0 || t.length > 64) {
    return null;
  }
  return t;
};

/** @param {Record<string, string>} row */
const urnFromRow = (row) => {
  let c = findCol(row, (k) => k === 'school_urn' || k === 'urn');
  if (c === null) {
    c = findCol(row, (k) => k.includes('school') && k.includes('urn'));
  }
  if (c === null) {
    return { score: null, key: null };
  }
  const raw = String(c.value).trim();
  return /^\d+$/.test(raw) ? raw : null;
};

/** @param {Record<string, string>} row */
const progress8ScoreFromRow = (row) => {
  let c = findCol(row, (k) => k === 'progress8_average');
  if (c === null) {
    c = findCol(row, (k) => {
      if (!k.includes('progress8') || !k.includes('average')) {
        return false;
      }
      if (k.includes('ebacc') || k.includes('element') || k.includes('eng') || k.includes('mat')) {
        return false;
      }
      return true;
    });
  }
  if (c === null) {
    return { score: null, key: null };
  }
  const v = num(c.value);
  if (!Number.isFinite(v)) {
    return { score: null, key: null };
  }
  return { score: progress8ToScore(v), key: norm(c.key) };
};

/** @param {Record<string, string>} row */
const ks2PrimaryScoreFromRow = (row) => {
  const vals = [];
  const keys = new Set();
  for (const [key, raw] of Object.entries(row)) {
    const k = norm(key);
    const looksKs2Pct =
      ((k.includes('expected') && k.includes('standard')) ||
        k.includes('exstd') ||
        k.includes('meeting_expected')) &&
      (k.includes('read') || k.includes('math') || k.includes('writ') || k.includes('rwm'));
    if (!looksKs2Pct) {
      continue;
    }
    const x = num(raw);
    if (Number.isFinite(x) && x >= 0 && x <= 100) {
      vals.push(x);
      keys.add(k);
    }
  }
  if (vals.length === 0) {
    return { score: null, keys };
  }
  return { score: clamp(vals.reduce((a, b) => a + b, 0) / vals.length), keys };
};

/** @param {Record<string, string>} row */
const patchFromRow = (row) => {
  /** @type {Record<string, number>} */
  const out = {};
  const matchedMetricKeys = new Set();
  const p8 = progress8ScoreFromRow(row);
  if (p8.score !== null) {
    out.secondary = p8.score;
    out.sixth_form = p8.score;
    if (p8.key !== null) {
      matchedMetricKeys.add(p8.key);
    }
  }
  const ks2 = ks2PrimaryScoreFromRow(row);
  if (ks2.score !== null) {
    out.primary = ks2.score;
    for (const k of ks2.keys) {
      matchedMetricKeys.add(k);
    }
  }
  return { patch: out, matchedMetricKeys };
};

const tsStringLiteral = (s) => JSON.stringify(s);
const isoNow = () => new Date().toISOString();

const looksPotentialMetricKey = (k) => {
  if (
    k.includes('urn') ||
    k.includes('laestab') ||
    k.includes('school name') ||
    k.includes('schoolname')
  ) {
    return false;
  }
  return (
    k.includes('progress') ||
    k.includes('attain') ||
    k.includes('score') ||
    k.includes('average') ||
    k.includes('expected') ||
    k.includes('standard') ||
    k.includes('exstd') ||
    k.includes('percent') ||
    k.includes('percentage') ||
    k.includes('rwm') ||
    k.includes('reading') ||
    k.includes('math') ||
    k.includes('writ')
  );
};

const manifestOutPathFromMapPath = (mapOutPath) =>
  join(dirname(mapOutPath), 'londonSchoolPerformanceManifest.ts');
const manifestJsonOutPathFromMapPath = (mapOutPath) =>
  join(dirname(mapOutPath), 'londonSchoolPerformanceManifest.json');

const topCounts = (counts, take = 25) =>
  Object.fromEntries(
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, take),
  );

const main = () => {
  const defaultOut = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'shared/schools/londonSchoolPerformanceByUrn.ts',
  );

  const { academicYearFlag, paths: rawPaths } = parseCli(process.argv.slice(2));

  let outPath = defaultOut;
  let csvPaths = rawPaths;
  if (rawPaths.length >= 1) {
    const last = rawPaths[rawPaths.length - 1];
    if (typeof last === 'string' && last.endsWith('.ts')) {
      outPath = last;
      csvPaths = rawPaths.slice(0, -1);
    }
  }

  if (csvPaths.length === 0) {
    console.error(
      'Usage: node scripts/ingest-dfe-performance.mjs [--academic-year LABEL] <performance.csv> [more.csv ...] [out.ts]',
    );
    process.exit(1);
  }

  let academicYearExplicit = null;
  if (academicYearFlag !== null) {
    academicYearExplicit = sanitizeAcademicYearLabel(academicYearFlag);
    if (academicYearExplicit === null) {
      console.error(
        'ingest-dfe-performance: invalid --academic-year (use 1–64 non-empty characters)',
      );
      process.exit(1);
    }
  }

  const inferred =
    academicYearExplicit === null
      ? inferAcademicYearFromBasenames(csvPaths.map((p) => basename(p)))
      : null;
  const academicYearResolved = academicYearExplicit ?? inferred;

  /** @type {Record<string, Record<string, number>>} */
  const acc = {};
  /** @type {Record<string, number>} */
  const candidateUnmappedMetricColumns = {};
  const generatedAtIso = isoNow();
  let rowsIn = 0;
  let rowsWithUrn = 0;
  let rowsDroppedNoUrn = 0;
  let rowsDroppedNoMappedScore = 0;
  let rowsMapped = 0;
  let mappedSecondaryRows = 0;
  let mappedSixthFormRows = 0;
  let mappedPrimaryRows = 0;

  for (const inPath of csvPaths) {
    const text = readFileSync(inPath, 'utf8');
    /** @type {Record<string, string>[]} */
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });
    rowsIn += rows.length;

    for (const row of rows) {
      const urn = urnFromRow(row);
      if (urn === null) {
        rowsDroppedNoUrn += 1;
        continue;
      }
      rowsWithUrn += 1;
      const { patch, matchedMetricKeys } = patchFromRow(row);
      if (Object.keys(patch).length === 0) {
        rowsDroppedNoMappedScore += 1;
        continue;
      }
      rowsMapped += 1;
      if (typeof patch.secondary === 'number') {
        mappedSecondaryRows += 1;
      }
      if (typeof patch.sixth_form === 'number') {
        mappedSixthFormRows += 1;
      }
      if (typeof patch.primary === 'number') {
        mappedPrimaryRows += 1;
      }
      for (const [rawKey, rawValue] of Object.entries(row)) {
        const key = norm(rawKey);
        if (!looksPotentialMetricKey(key) || matchedMetricKeys.has(key)) {
          continue;
        }
        const v = num(rawValue);
        if (Number.isFinite(v)) {
          candidateUnmappedMetricColumns[key] = (candidateUnmappedMetricColumns[key] ?? 0) + 1;
        }
      }
      const cur = acc[urn] ?? {};
      Object.assign(cur, patch);
      acc[urn] = cur;
    }
  }

  const inputBasenames = csvPaths.map((p) => basename(p)).join(', ');
  const yearComment =
    academicYearResolved !== null
      ? `Academic year label: ${academicYearResolved} (from ${academicYearExplicit !== null ? 'CLI' : 'filename inference'}).`
      : 'Academic year: not set — pass --academic-year or use filenames such as *2023-24*.';

  const preamble = `import type { SchoolPhaseDto } from '../searchAreasContract';

/**
 * URN → performance by phase (0–100), from official DfE performance CSVs (OGL family).
 * GENERATED by scripts/ingest-dfe-performance.mjs from: ${inputBasenames}.
 * ${yearComment}
 * Source: Find school performance / Explore education statistics — verify licence and attribution for your release.
 * Re-run after downloading fresh CSVs.
 */
export type LondonSchoolPerformanceByUrn = Readonly<
  Record<string, Partial<Record<SchoolPhaseDto, number>>>
>;

export const LONDON_SCHOOL_PERFORMANCE_ACADEMIC_YEAR: string | undefined = ${academicYearResolved !== null ? tsStringLiteral(academicYearResolved) : 'undefined'};

`;

  const fileBody = `${preamble}export const LONDON_SCHOOL_PERFORMANCE_BY_URN: LondonSchoolPerformanceByUrn = ${JSON.stringify(
    acc,
    null,
    2,
  )} as const;
`;
  const manifestPayload = {
    generatedAtIso,
    inputs: csvPaths.map((p) => basename(p)),
    ...(academicYearResolved !== null
      ? { schoolsPerformanceAcademicYear: academicYearResolved }
      : {}),
    urnCount: Object.keys(acc).length,
    rowsIn,
    rowsWithUrn,
    rowsDroppedNoUrn,
    rowsDroppedNoMappedScore,
    rowsMapped,
    mappedSecondaryRows,
    mappedSixthFormRows,
    mappedPrimaryRows,
    candidateUnmappedMetricColumns: topCounts(candidateUnmappedMetricColumns),
  };
  const manifestBody = `export interface LondonSchoolPerformanceManifest {
  readonly generatedAtIso: string;
  readonly inputs: readonly string[];
  readonly schoolsPerformanceAcademicYear?: string;
  readonly urnCount: number;
  readonly rowsIn: number;
  readonly rowsWithUrn: number;
  readonly rowsDroppedNoUrn: number;
  readonly rowsDroppedNoMappedScore: number;
  readonly rowsMapped: number;
  readonly mappedSecondaryRows: number;
  readonly mappedSixthFormRows: number;
  readonly mappedPrimaryRows: number;
  readonly candidateUnmappedMetricColumns: Readonly<Record<string, number>>;
}

/** GENERATED by scripts/ingest-dfe-performance.mjs from: ${inputBasenames}. */
export const LONDON_SCHOOL_PERFORMANCE_MANIFEST: LondonSchoolPerformanceManifest = ${JSON.stringify(manifestPayload, null, 2)} as const;
`;

  writeFileSync(outPath, fileBody, 'utf8');
  const manifestOutPath = manifestOutPathFromMapPath(outPath);
  writeFileSync(manifestOutPath, manifestBody, 'utf8');
  const manifestJsonOutPath = manifestJsonOutPathFromMapPath(outPath);
  writeFileSync(manifestJsonOutPath, `${JSON.stringify(manifestPayload, null, 2)}\n`, 'utf8');
  console.error(
    JSON.stringify({
      component: 'dfe_performance_ingest',
      inputs: csvPaths,
      output: outPath,
      manifestOutput: manifestOutPath,
      manifestJsonOutput: manifestJsonOutPath,
      urnCount: Object.keys(acc).length,
      schoolsPerformanceAcademicYear: academicYearResolved,
      rowsIn,
      rowsWithUrn,
      rowsDroppedNoUrn,
      rowsDroppedNoMappedScore,
      rowsMapped,
      mappedSecondaryRows,
      mappedSixthFormRows,
      mappedPrimaryRows,
      candidateUnmappedMetricColumns: topCounts(candidateUnmappedMetricColumns, 10),
    }),
  );
};

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
