# AWS serverless (SAM)

The API is **AWS Lambda** + **API Gateway HTTP API**, defined in [`template.yaml`](../../template.yaml) and implemented under [`lambda/`](../../lambda/).

## Why AWS here

- Keeps secrets and heavy aggregation off the browser.
- Fits **London-first** growth (IAM, VPC, RDS, etc.) on one cloud.
- **SAM** gives repeatable **local** API emulation and **deploy** to your account.

## Prerequisites

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) on your `PATH` (`sam --version`). **`npm run verify` does not run `sam build`** — install SAM separately for API work.
- **`esbuild`** — listed in this repo’s **devDependencies** so `sam build` (esbuild bundling) can find it after `npm install`. Global install on `PATH` also works.
- **Docker** (required for `sam local start-api`)
- AWS credentials configured when you deploy (`aws configure` or environment/SSO)

## Local API (replace Vite-only backend)

From the repo root:

```bash
npm run sam:build
npm run sam:local
```

This runs **`sam local start-api`** on port **3000** by default. **Vite** ([`vite.config.ts`](../../vite.config.ts)) proxies `/api/*` to that port, so `npm run dev` + `npm run sam:local` matches production paths (`/api/search-areas`, `/api/health`).

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
