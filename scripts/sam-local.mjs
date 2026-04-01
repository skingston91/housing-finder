#!/usr/bin/env node
/**
 * Runs `sam local start-api` with merged env for Lambdas:
 * 1) sam/env.json.example (defaults)
 * 2) .env in repo root (TFL_APP_KEY, ORS_API_KEY, etc. — same names as Lambda)
 * 3) sam/env.json if present (overrides; optional team file)
 *
 * Writes a temp JSON file for --env-vars (secrets stay out of shell history).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const parseDotEnv = (text) => {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) {
      continue;
    }
    const eq = t.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
};

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

/** @type {Record<string, [string, string]>} */
const DOTENV_TO_SAM = {
  TFL_APP_KEY: ['SearchAreasFunction', 'TFL_APP_KEY'],
  ORS_API_KEY: ['SearchAreasFunction', 'ORS_API_KEY'],
  UKHPI_LIVE: ['SearchAreasFunction', 'UKHPI_LIVE'],
  MAPBOX_ACCESS_TOKEN: ['GeocodeWorkplaceFunction', 'MAPBOX_ACCESS_TOKEN'],
  GEOCODE_RATE_LIMIT_PER_MINUTE: ['GeocodeWorkplaceFunction', 'GEOCODE_RATE_LIMIT_PER_MINUTE'],
};

const applyDotEnvToEnvJson = (envJson, dot) => {
  let merged = envJson;
  for (const [envKey, val] of Object.entries(dot)) {
    const mapping = DOTENV_TO_SAM[envKey];
    if (mapping === undefined) {
      continue;
    }
    const [fnId, varName] = mapping;
    merged = deepMerge(merged, {
      [fnId]: { [varName]: val },
    });
  }
  return merged;
};

const examplePath = join(root, 'sam/env.json.example');
const envJsonPath = join(root, 'sam/env.json');
const dotenvPath = join(root, '.env');

let merged = JSON.parse(readFileSync(examplePath, 'utf8'));

if (existsSync(dotenvPath)) {
  const dot = parseDotEnv(readFileSync(dotenvPath, 'utf8'));
  merged = applyDotEnvToEnvJson(merged, dot);
  const arn = dot.API_SECRETS_ARN?.trim();
  if (arn !== undefined && arn !== '') {
    merged = deepMerge(merged, {
      SearchAreasFunction: { API_SECRETS_ARN: arn },
      GeocodeWorkplaceFunction: { API_SECRETS_ARN: arn },
    });
  }
}

if (existsSync(envJsonPath)) {
  merged = deepMerge(merged, JSON.parse(readFileSync(envJsonPath, 'utf8')));
}

const outPath = join(tmpdir(), `housing-finder-sam-env-${String(process.pid)}.json`);
writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');

// `sam local` without a prior `sam build` mounts the repo as /var/task and cannot load
// TypeScript handlers (Runtime.ImportModuleError: Cannot find module 'search-areas').
// Built functions live under .aws-sam/build/<FunctionId>/ with esbundle + corrected Handler.
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
