# AWS serverless (SAM)

The API is **AWS Lambda** + **API Gateway HTTP API**, defined in [`template.yaml`](../../template.yaml) and implemented under [`lambda/`](../../lambda/).

## Why AWS here

- Keeps secrets and heavy aggregation off the browser.
- Fits **London-first** growth (IAM, VPC, RDS, etc.) on one cloud.
- **SAM** gives repeatable **local** API emulation and **deploy** to your account.

## CORS (browser → API)

[`template.yaml`](../../template.yaml) **Parameters** include **`CorsAdditionalOrigin`**. **http://localhost:5173** is always allowed for Vite. Set **`CorsAdditionalOrigin`** to your deployed site origin (e.g. `https://housing.example.com`) on **`sam deploy --parameter-overrides`** so the hosted front end can call the API cross-origin. Empty string = localhost only.

## Prerequisites

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) on your `PATH` (`sam --version`). **`npm run verify` does not run `sam build`**. Use **`npm run verify:sam`** for a full pre-deploy check: `verify` → **`verify:data`** (DfE manifest gate from [`scripts/check-dfe-manifest.mjs`](../../scripts/check-dfe-manifest.mjs)) → **`sam build`**. Install SAM separately for API work.
- **`esbuild`** — listed in **`dependencies`** (not `devDependencies`) because SAM’s `NodejsNpmEsbuildBuilder` runs `npm install` **without dev dependencies** in the build tree; if `esbuild` were only a devDependency, `sam build` fails with “Cannot find esbuild”. It is a build-time tool only; the Lambda bundle does not need it at runtime.
- **Docker** (required for `sam local start-api`)
- AWS credentials configured when you deploy (`aws configure` or environment/SSO)

## Local API (replace Vite-only backend)

From the repo root:

```bash
cp sam/env.json.example sam/env.json
# Edit sam/env.json (TfL, ORS, Mapbox, UKHPI_LIVE, …). Optional: sam/env.local.json for secrets (gitignored).
npm run sam:build
npm run sam:local
```

[`scripts/sam-local.mjs`](../../scripts/sam-local.mjs) **requires** **`sam/env.json`** (fail fast if missing — no implicit merge from `env.json.example`). It loads that file, then optionally deep-merges **`sam/env.local.json`** if present. **Repo root `.env` is not used** for Lambdas (only **`sam/env.*.json`**). **Vite** ([`vite.config.ts`](../../vite.config.ts)) uses **`.env` / `.env.local`** for **`VITE_*`** only — see repo **`.env.example`**. See [`sam/README.md`](../../sam/README.md).

Optional **`SAM_LOCAL_STRICT=1`**: exit before `sam build` if **`SearchAreasFunction`** has neither **`TFL_APP_KEY`** nor **`API_SECRETS_ARN`** (catches “transit with no key” early).

### TfL keys (transit commute)

`SearchAreasFunction` reads **`TFL_APP_KEY`** only (see [`template.yaml`](../../template.yaml) **Parameters**). TfL’s current guidance: append **`app_key`** as a query parameter; **ignore `app_id`** (no longer required). Register at [TfL Open Data](https://api.tfl.gov.uk/).

**Local SAM:** set **`TFL_APP_KEY`** under **`SearchAreasFunction`** in **`sam/env.json`** (or **`sam/env.local.json`**), then run **`npm run sam:local`**. Or pass the same parameters on **`sam deploy`** so production Lambdas receive the variables.

### OpenRouteService (optional drive / cycle / walk commute)

`SearchAreasFunction` reads **`ORS_API_KEY`** from the **`OrsApiKey`** template parameter. When set, **driving**, **cycling**, and **walking** commute modes use [OpenRouteService](https://openrouteservice.org/) directions (not **transit** — use TfL). When empty, those modes use the straight-line time proxy. Register for an API key and follow provider quotas and terms.

**Local SAM:** add **`ORS_API_KEY`** under **`SearchAreasFunction`** in **`sam/env.json`** (see [`sam/env.json.example`](../../sam/env.json.example)). Same file as TfL — not root `.env`.

### Strict commute routing (deployed vs SAM local)

**Deployed Lambdas** (real AWS, not `sam local`) **always** enforce keys for the commute mode in use: `POST /api/search-areas` returns **400** if **transit** needs **`TFL_APP_KEY`** or **driving** / **cycling** / **walking** needs **`ORS_API_KEY`** but the resolved value is empty — no silent straight-line fallback (`shared/searchAreas/resolveSearchAreasRoutingStrict.ts`).

**SAM local** (`AWS_SAM_LOCAL=true`): `SearchAreasFunction` env **`SEARCH_AREAS_ROUTING_STRICT`** (`template.yaml` **Parameter** **`SearchAreasRoutingStrict`**, default **`0`**) controls the same check. When **`1`**, behavior matches production. When **`0`**, missing keys are allowed; the **search Lambda logs a warning** to the console per request, and **`npm run sam:local`** prints **warnings** at startup for missing optional keys. See [`sam/env.json.example`](../../sam/env.json.example) for **`"SEARCH_AREAS_ROUTING_STRICT": "0"`**.

### UK HPI affordability (optional live borough prices)

`SearchAreasFunction` reads **`UKHPI_LIVE`**. When set to **`0`**, affordability uses the **static** in-repo borough median table only. When **empty or any other value** (default in `template.yaml`), the handler fetches latest **UK HPI average prices** per London borough from [HM Land Registry linked data](https://landregistry.data.gov.uk/app/ukhpi/doc/) (JSON API), **cached 6 hours** per warm instance. **Local SAM:** [`sam/env.json.example`](../../sam/env.json.example) sets **`"UKHPI_LIVE": "0"`** in **`sam/env.json`** to avoid hammering Land Registry during dev; remove or change for live HPI.

### Mapbox (optional workplace geocode)

`GeocodeWorkplaceFunction` reads **`MAPBOX_ACCESS_TOKEN`** from the **`MapboxAccessToken`** template parameter (see [`template.yaml`](../../template.yaml)). When empty, geocoding uses Nominatim only. When set, Mapbox is tried first and Nominatim is used as fallback. Register at [Mapbox](https://www.mapbox.com/) and follow their billing and usage terms.

**Local SAM:** add `GeocodeWorkplaceFunction` → `MAPBOX_ACCESS_TOKEN` in **`sam/env.json`** (see [`sam/env.json.example`](../../sam/env.json.example)); not root `.env`.

### Geocode rate limit

`GeocodeWorkplaceFunction` enforces **`GEOCODE_RATE_LIMIT_PER_MINUTE`** (default **30** per client IP per rolling minute in [`template.yaml`](../../template.yaml)). Counts are **in-memory per Lambda instance** (warm-container only). **`0`** disables limiting. On exceed, the API returns **429** with **`Retry-After`** and JSON **`retryAfterSeconds`**.

### Secrets Manager (optional API keys)

[`template.yaml`](../../template.yaml) **Parameter** **`ApiSecretsArn`** (optional). When set to a [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/) secret **ARN**, both **`SearchAreasFunction`** and **`GeocodeWorkplaceFunction`** receive **`API_SECRETS_ARN`** and may read **`SecretString`** as JSON with optional keys **`TFL_APP_KEY`**, **`ORS_API_KEY`**, **`MAPBOX_ACCESS_TOKEN`**. **Plain template parameters still win** when non-empty (see [`shared/secrets/apiSecrets.ts`](../../shared/secrets/apiSecrets.ts)). CloudFormation attaches **`ApiSecretsReadPolicy`** (`secretsmanager:GetSecretValue` on that ARN) only when **`ApiSecretsArn`** is not empty. If the secret uses a **customer-managed KMS** key, add **`kms:Decrypt`** on that key to the execution role (not included by default).

### UK HPI resolution logs

With live UK HPI enabled, **`resolveLondonBoroughMedianRows`** emits a single **structured JSON** line per resolution (component **`ukhpi_resolution`**) to **stdout** — SPARQL outcome, JSON fallback counts, failed borough id sample, duration — for **CloudWatch Logs** filtering. No personal data.

## Build and deploy

```bash
npm run sam:build
sam deploy --guided
```

First run: choose stack name, region, and whether to allow SAM to create an S3 bucket for artifacts. [`samconfig.toml`](../../samconfig.toml) stores defaults after `--guided`.

## Stack outputs

After deploy, get the **HTTP API** base URL from the CloudFormation stack outputs in the AWS Console (or `aws cloudformation describe-stacks`). Point a production front end at that host, or put **CloudFront** / **S3** static hosting in front and allow CORS origins for your site (update `HousingHttpApi` `CorsConfiguration` in `template.yaml`).

## Node runtime

Functions use **Node.js 22** on **arm64**. Change `Runtime` / `Architectures` in `template.yaml` if your account or region requires it.

SAM **esbuild** bundles use **`Format: cjs`** so the runtime loads the handler as CommonJS. ESM-only bundles (`export` without `"type": "module"`) cause `Unexpected token 'export'` at invoke time.
