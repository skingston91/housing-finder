# Troubleshooting log

Add a dated entry when you hit a non-obvious issue and fix it. Short bullets are enough.

## Template

```
### YYYY-MM-DD — Short title
- **Symptom:**
- **Cause:**
- **Fix:** (command, file, or doc link)
```

---

### 2026-03-28 — Initial scaffold

- **Symptom:** N/A (greenfield).
- **Cause:** N/A.
- **Fix:** Repo created with Vite + React + Chakra, Vitest, `api/` serverless stub, and docs above.

### 2026-03-28 — Search returns network / fetch error in dev

- **Symptom:** UI shows “Search error” when clicking Search with Vite only.
- **Cause:** `/api/*` is implemented by **AWS Lambda** (local emulation), not by Vite.
- **Fix:** Run `npm run sam:build` and `npm run sam:local` (port 3000) alongside `npm run dev` so the Vite proxy can reach the API. Requires **Docker** and **SAM CLI**. See [infrastructure/aws-sam.md](./infrastructure/aws-sam.md).

### 2026-03-28 — `npm install` audit noise

- **Symptom:** `npm install` reports moderate/high vulnerabilities (often transitive dev tooling).
- **Cause:** Dependency tree includes dev/build-time packages with known advisories.
- **Fix:** Run `npm audit` for detail; apply `npm audit fix` where safe. Re-audit after upgrades; do not use `--force` without reviewing breaking changes.

### 2026-03-28 — SAM `sam build` / Handler errors

- **Symptom:** Build fails or Lambda cannot find handler.
- **Cause:** `Handler` in `template.yaml` must match the **esbuild entry file** basename and exported name (`handler`).
- **Fix:** See [infrastructure/aws-sam.md](./infrastructure/aws-sam.md); confirm `lambda/*.ts` uses `export const handler`.

### 2026-03-28 — Vite `http proxy error` / `ECONNREFUSED 127.0.0.1:3000`

- **Symptom:** Browser or Vite log shows proxy failure for `/api/search-areas`.
- **Cause:** [`vite.config.ts`](../vite.config.ts) proxies `/api` to **port 3000**. Nothing is listening there until **`sam local start-api`** is running.
- **Fix:** In another terminal (after `sam build`): `npm run sam:local`, or use **`npm run dev:stack`** to run API + Vite together. Requires **Docker** for SAM local.

### 2026-03-28 — `Cannot find esbuild` (sam build)

- **Symptom:** `sam build` fails at `NodejsNpmEsbuildBuilder:EsbuildBundle` even after `npm install`.
- **Cause:** SAM copies `CodeUri` and runs **`npm install` without dev dependencies**. **`esbuild` in `devDependencies` is never installed** in that tree, so the bundler cannot find it.
- **Fix:** Keep **`esbuild` in `dependencies`** (as in this repo) or install esbuild globally on `PATH`. Alternatively set `Metadata.BuildProperties.NpmInstallArguments` to include dev installs (heavier).

### 2026-03-28 — `Unexpected token 'export'` / `Failed to load the ES module` (sam local)

- **Symptom:** Invoke returns 500; logs show `SyntaxError: Unexpected token 'export'` for `*.js` in `/var/task`.
- **Cause:** esbuild was emitting **ESM** while the Lambda loader treated the file as **CommonJS** (no `package.json` with `"type": "module"` in the artifact).
- **Fix:** Use **`Format: cjs`** under `Metadata.BuildProperties` in `template.yaml`, then `sam build` again.

### 2026-04-12 — Crime subscores look “flat” in logs / debugging ranking

- **Symptom:** Need per-search **distribution** of crime subscores (min/max/spread) when tuning normalization.
- **Cause:** N/A — optional diagnostics.
- **Fix:** Set **`HOUSING_FINDER_SCORING_DIAGNOSTICS=1`** for `SearchAreasFunction` in **`sam/env.local.json`** (or deployed env). Logs one JSON line per search: `crime_score_search_diagnostics`. See [scoring-behaviour.md](./scoring-behaviour.md). Leave unset in production unless investigating.

### 2026-04-12 — TfL rate limits (429) or uneven journey success across many candidates

- **Symptom:** Some areas fall back to straight-line commute while others get TfL routes; HTTP **429** in logs.
- **Cause:** Journey Planner is called **once per candidate** (serialized); bursts and retries can still hit fair-use limits.
- **Fix:** Optional **`TFL_JOURNEY_MIN_INTERVAL_MS`** on `SearchAreasFunction` (default **450** ms minimum gap between completed TfL HTTP calls; **`0`** disables). See **`sam/env.json.example`**. Increase spacing if needed; watch Lambda **timeout** on large grids.

### 2026-04-12 — TfL journey cache TTL

- **Symptom:** Want to reuse Journey Planner results longer across searches on the same warm Lambda (or disable caching for debugging).
- **Cause:** N/A — tuning.
- **Fix:** **`TFL_JOURNEY_CACHE_TTL_MS`** on `SearchAreasFunction` (milliseconds; default **900000** = **15 min** if unset; **1 min**–**24 h** clamp; **`0`** disables success caching). See **`sam/env.json.example`**. Successful journeys only; failures are never cached.
