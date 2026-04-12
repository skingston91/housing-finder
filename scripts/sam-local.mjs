#!/usr/bin/env node
/**
 * Runs `sam local start-api` with Lambda env from **SAM JSON only** (not repo root `.env`):
 *
 * 1. **sam/env.json** (required) — copy from `sam/env.json.example` once; gitignored by default.
 * 2. **sam/env.local.json** (optional) — merged on top; gitignored; use for secrets without editing (1).
 *
 * Frontend (Vite) uses **`.env` / `.env.local`** at repo root for `VITE_*` only — see `.env.example`.
 *
 * Optional: **SAM_LOCAL_STRICT=1** — exit non‑zero if SearchAreasFunction has neither TFL_APP_KEY nor API_SECRETS_ARN
 * (fails fast before a transit search hits TfL with no key).
 * Otherwise prints **warnings** to the console when common API keys are missing (Nominatim-only geocode, straight-line routing).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const deepMerge = (base, override) => {
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      typeof out[k] === 'object' &&
      out[k] !== null &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMerge(
        /** @type {Record<string, unknown>} */ (out[k]),
        /** @type {Record<string, unknown>} */ (v),
      );
    } else {
      out[k] = v;
    }
  }
  return out;
};

const REQUIRED_FUNCTION_IDS = ['SearchAreasFunction', 'GeocodeWorkplaceFunction'];

const validateSamEnvShape = (merged) => {
  if (typeof merged !== 'object' || merged === null) {
    throw new Error('sam/env.json must contain a single JSON object');
  }
  for (const id of REQUIRED_FUNCTION_IDS) {
    const block = merged[id];
    if (typeof block !== 'object' || block === null) {
      throw new Error(`sam/env.json must include a "${id}" object (see sam/env.json.example)`);
    }
  }
};

const envJsonPath = join(root, 'sam/env.json');
const envLocalPath = join(root, 'sam/env.local.json');

if (!existsSync(envJsonPath)) {
  console.error(
    [
      'sam-local: missing sam/env.json',
      '',
      '  Create it once:',
      '    cp sam/env.json.example sam/env.json',
      '',
      '  Then edit sam/env.json (and optionally sam/env.local.json for secrets) — see docs/infrastructure/aws-sam.md',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

let merged;
try {
  merged = JSON.parse(readFileSync(envJsonPath, 'utf8'));
} catch (e) {
  console.error(
    `sam-local: failed to parse sam/env.json: ${e instanceof Error ? e.message : String(e)}`,
  );
  process.exit(1);
}

try {
  validateSamEnvShape(merged);
} catch (e) {
  console.error(`sam-local: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}

if (existsSync(envLocalPath)) {
  try {
    const local = JSON.parse(readFileSync(envLocalPath, 'utf8'));
    merged = deepMerge(merged, local);
    validateSamEnvShape(merged);
  } catch (e) {
    console.error(
      `sam-local: failed to merge sam/env.local.json: ${e instanceof Error ? e.message : String(e)}`,
    );
    process.exit(1);
  }
}

const warnSamLocalEnvGaps = (env) => {
  if (process.env.SAM_LOCAL_QUIET === '1') {
    return;
  }
  const sa = env.SearchAreasFunction;
  const gc = env.GeocodeWorkplaceFunction;
  const tfl = typeof sa.TFL_APP_KEY === 'string' ? sa.TFL_APP_KEY.trim() : '';
  const arn = typeof sa.API_SECRETS_ARN === 'string' ? sa.API_SECRETS_ARN.trim() : '';
  const ors = typeof sa.ORS_API_KEY === 'string' ? sa.ORS_API_KEY.trim() : '';
  const mapbox = typeof gc.MAPBOX_ACCESS_TOKEN === 'string' ? gc.MAPBOX_ACCESS_TOKEN.trim() : '';
  const lines = [];
  if (tfl === '' && arn === '') {
    lines.push(
      'SearchAreasFunction: no TFL_APP_KEY and no API_SECRETS_ARN — transit commute falls back to straight-line unless the secret provides TFL_APP_KEY.',
    );
  }
  if (ors === '') {
    lines.push(
      'SearchAreasFunction: ORS_API_KEY empty — driving/cycling/walking fall back to straight-line (deployed API rejects those modes until configured).',
    );
  }
  if (mapbox === '') {
    lines.push(
      'GeocodeWorkplaceFunction: MAPBOX_ACCESS_TOKEN empty — workplace geocoding uses Nominatim only.',
    );
  }
  if (lines.length === 0) {
    return;
  }
  console.warn(
    [
      'sam-local: some API keys are unset in merged env (warnings only):',
      ...lines.map((l) => `  - ${l}`),
      '',
    ].join('\n'),
  );
};

warnSamLocalEnvGaps(merged);

if (process.env.SAM_LOCAL_STRICT === '1') {
  const sa = merged.SearchAreasFunction;
  const tfl = typeof sa.TFL_APP_KEY === 'string' ? sa.TFL_APP_KEY.trim() : '';
  const arn = typeof sa.API_SECRETS_ARN === 'string' ? sa.API_SECRETS_ARN.trim() : '';
  if (tfl === '' && arn === '') {
    console.error(
      [
        'sam-local: SAM_LOCAL_STRICT=1 but SearchAreasFunction has neither TFL_APP_KEY nor API_SECRETS_ARN.',
        '  Set one of them in sam/env.json or sam/env.local.json.',
      ].join('\n'),
    );
    process.exit(1);
  }
}

const outPath = join(tmpdir(), `housing-finder-sam-env-${String(process.pid)}.json`);
writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');

const build = spawnSync('sam', ['build'], { stdio: 'inherit', cwd: root });
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const r = spawnSync('sam', ['local', 'start-api', '--port', '3000', '--env-vars', outPath], {
  stdio: 'inherit',
  cwd: root,
});

try {
  unlinkSync(outPath);
} catch {
  /* ignore */
}

process.exit(r.status ?? 1);
