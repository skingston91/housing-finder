# AWS serverless (SAM)

The API is **AWS Lambda** + **API Gateway HTTP API**, defined in [`template.yaml`](../../template.yaml) and implemented under [`lambda/`](../../lambda/).

## Why AWS here

- Keeps secrets and heavy aggregation off the browser.
- Fits **London-first** growth (IAM, VPC, RDS, etc.) on one cloud.
- **SAM** gives repeatable **local** API emulation and **deploy** to your account.

## Prerequisites

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) on your `PATH` (`sam --version`). **`npm run verify` does not run `sam build`** — install SAM separately for API work.
- **`esbuild`** — listed in **`dependencies`** (not `devDependencies`) because SAM’s `NodejsNpmEsbuildBuilder` runs `npm install` **without dev dependencies** in the build tree; if `esbuild` were only a devDependency, `sam build` fails with “Cannot find esbuild”. It is a build-time tool only; the Lambda bundle does not need it at runtime.
- **Docker** (required for `sam local start-api`)
- AWS credentials configured when you deploy (`aws configure` or environment/SSO)

## Local API (replace Vite-only backend)

From the repo root:

```bash
npm run sam:build
npm run sam:local
```

This runs **`sam local start-api`** on port **3000** by default. **Vite** ([`vite.config.ts`](../../vite.config.ts)) proxies `/api/*` to that port, so `npm run dev` + `npm run sam:local` matches production paths (`/api/search-areas`, `/api/geocode-workplace`, `/api/health`).

### TfL keys (transit commute)

`SearchAreasFunction` reads **`TFL_APP_ID`** and **`TFL_APP_KEY`** (see [`template.yaml`](../../template.yaml) **Parameters**). Register at [TfL Open Data](https://api.tfl.gov.uk/).

**Local SAM:** copy [`sam/env.json.example`](../../sam/env.json.example) to **`sam/env.json`** (gitignored), fill keys, then:

```bash
sam local start-api --port 3000 --env-vars sam/env.json
```

Or pass the same parameters on **`sam deploy`** so production Lambdas receive the variables.

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
