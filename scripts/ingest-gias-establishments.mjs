#!/usr/bin/env node
/**
 * Ingest a GIAS / Get Information about Schools establishments CSV (OGL) and emit
 * `shared/schools/londonStateSchoolEstablishmentSample.ts`.
 *
 * Usage:
 *   node scripts/ingest-gias-establishments.mjs /path/to/establishments.csv [out.ts]
 *
 * Filters: open state-funded schools in a Greater London bounding box; needs
 * Latitude/Longitude or Easting/Northing (OSGB → WGS84 via proj4).
 */
import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import proj4 from 'proj4';

const OSGB =
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446,-125,542,0.15,0.247,0.842,-20.489 +units=m +no_defs';
const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

/** Rough Greater London bbox (WGS84). */
const IN_LONDON = (lat, lng) =>
  lat >= 51.22 && lat <= 51.75 && lng >= -0.55 && lng <= 0.38;

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** @param {string} phaseText */
const phasesFromGias = (phaseText) => {
  const p = norm(phaseText);
  if (p.length === 0) {
    return ['primary'];
  }
  if (p.includes('all-through') || p.includes('all through')) {
    return ['primary', 'secondary', 'sixth_form'];
  }
  if (p.includes('16 plus') || p.includes('16+') || p.includes('sixth')) {
    return ['sixth_form'];
  }
  if (p.includes('secondary') && p.includes('primary')) {
    return ['primary', 'secondary'];
  }
  if (p.includes('secondary')) {
    return ['secondary'];
  }
  if (p.includes('primary')) {
    return ['primary'];
  }
  if (p.includes('middle')) {
    return ['primary', 'secondary'];
  }
  return ['primary'];
};

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

/** @param {Record<string, string>} row */
const latLngFromRow = (row) => {
  const latK = findCol(row, (k) => (k.includes('latitude') || k === 'lat') && !k.includes('icrs'));
  const lngK = findCol(row, (k) =>
    (k.includes('longitude') || k === 'lng' || k === 'long') && !k.includes('icrs'),
  );
  if (latK !== null && lngK !== null) {
    const lat = num(latK.value);
    const lng = num(lngK.value);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  const eK = findCol(row, (k) => k.includes('easting'));
  const nK = findCol(row, (k) => k.includes('northing'));
  if (eK !== null && nK !== null) {
    const easting = num(eK.value);
    const northing = num(nK.value);
    if (Number.isFinite(easting) && Number.isFinite(northing)) {
      const [lng, lat] = proj4(OSGB, WGS84, [easting, northing]);
      return { lat, lng };
    }
  }
  return null;
};

/** @param {Record<string, string>} row */
const isOpenState = (row) => {
  const st = findCol(row, (k) => norm(k).includes('establishmentstatus') || norm(k) === 'status');
  const status = st !== null ? norm(st.value) : '';
  if (status.length > 0 && !status.includes('open')) {
    return false;
  }
  const tg = findCol(row, (k) => norm(k).includes('establishmenttypegroup'));
  if (tg !== null && norm(tg.value).includes('independent')) {
    return false;
  }
  const ty = findCol(row, (k) => norm(k).includes('typeofestablishment'));
  if (ty !== null && norm(ty.value).includes('independent')) {
    return false;
  }
  return true;
};

/** @param {Record<string, string>} row */
const phaseText = (row) => {
  const ph = findCol(row, (k) => k.includes('phase') && k.includes('education'));
  return ph !== null ? ph.value : '';
};

const main = () => {
  const inPath = process.argv[2];
  const defaultOut = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'shared/schools/londonStateSchoolEstablishmentSample.ts',
  );
  const outPath = process.argv[3] ?? defaultOut;

  if (inPath === undefined || inPath === '') {
    console.error('Usage: node scripts/ingest-gias-establishments.mjs <establishments.csv> [out.ts]');
    process.exit(1);
  }

  const raw = readFileSync(inPath, 'utf8');
  /** @type {Record<string, string>[]} */
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  /** @type {{ latitude: number; longitude: number; phases: string[] }[]} */
  const out = [];
  for (const row of rows) {
    if (!isOpenState(row)) {
      continue;
    }
    const ll = latLngFromRow(row);
    if (ll === null) {
      continue;
    }
    if (!IN_LONDON(ll.lat, ll.lng)) {
      continue;
    }
    const phases = phasesFromGias(phaseText(row));
    out.push({
      latitude: Math.round(ll.lat * 1e6) / 1e6,
      longitude: Math.round(ll.lng * 1e6) / 1e6,
      phases,
    });
  }

  const header = `import type { LondonSchoolSeed } from './londonSchoolSeeds';

/**
 * Extra London state-school-style coordinates for distance ranking (discovery only).
 * GENERATED by scripts/ingest-gias-establishments.mjs from ${basename(inPath)}.
 * Source: Get Information about Schools (OGL). Re-run the script after downloading a fresh CSV.
 */
`;

  const body = `export const LONDON_STATE_SCHOOL_ESTABLISHMENT_SAMPLE: readonly LondonSchoolSeed[] = ${JSON.stringify(
    out,
    null,
    2,
  )} as const;
`;

  writeFileSync(outPath, `${header}\n${body}\n`, 'utf8');
  console.error(
    JSON.stringify({
      component: 'gias_ingest',
      input: inPath,
      output: outPath,
      rowsIn: rows.length,
      rowsKept: out.length,
    }),
  );
};

main();
