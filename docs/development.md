# Development

## Prerequisites

- Node **22+**, npm **10+** (see `package.json` `engines`).

## Install

```bash
npm install
```

## Scripts

| Script               | Purpose                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Vite only ([http://localhost:5173](http://localhost:5173)); proxies `/api/*` → port **3000** — **fails with `ECONNREFUSED` if SAM local is not running** |
| `npm run dev:stack`  | **SAM local API (3000) + Vite (5173)** in one terminal (needs `sam build` + Docker first)                                                                |
| `npm run sam:build`  | `sam build` — bundle Lambdas (run after handler changes)                                                                                                 |
| `npm run sam:local`  | API Gateway + Lambda emulation on [http://127.0.0.1:3000](http://127.0.0.1:3000)                                                                         |
| `npm run build`      | Typecheck + production bundle to `dist/`                                                                                                                 |
| `npm run preview`    | Serve `dist/` locally                                                                                                                                    |
| `npm run test`       | Vitest (unit/component)                                                                                                                                  |
| `npm run lint`       | ESLint                                                                                                                                                   |
| `npm run verify`     | Lint, format check, `tsc`, tests, build                                                                                                                  |
| `npm run verify:sam` | Same as `verify`, then **`sam build`** (requires SAM CLI; use after Lambda or `template.yaml` changes)                                                   |

For **TfL / ORS / Mapbox** on Lambdas locally, use **`sam/env.json`** (required — copy from [`sam/env.json.example`](../sam/env.json.example)) and optionally **`sam/env.local.json`**. Root **`.env` is not read** by `npm run sam:local` (see [infrastructure/aws-sam.md](./infrastructure/aws-sam.md), [`sam/README.md`](../sam/README.md)).

## Environment variables

- **Vite:** copy `.env.example` to `.env` or `.env.local` for optional **`VITE_*`** only. **Only** `VITE_*` are exposed to the browser.
- **`VITE_MAPLIBRE_STYLE_URL`** (optional) — URL to a MapLibre-compatible style JSON for the results map; defaults to Carto Positron.
- **SAM local Lambdas:** **`TFL_APP_KEY`**, **`ORS_API_KEY`**, **`MAPBOX_ACCESS_TOKEN`**, etc. go under the right function objects in **`sam/env.json`** — not root `.env`.
- For production, use **SAM deploy parameters**, **AWS console env**, or **Secrets Manager**.

## Configuration and fail-fast

Prefer **clear failures** (explicit messages, non-zero exits, HTTP 4xx when misconfigured) over **silent wrong behaviour** that is hard to debug. Keep **Vite** env (`VITE_*` only) separate from **Lambda** env (`sam/env.json`). The repo encodes this for automation in [`.cursor/rules/fail-fast-configuration.mdc`](../.cursor/rules/fail-fast-configuration.mdc).

## Serverless API locally (AWS SAM)

Handlers live in [`lambda/`](../lambda/) and deploy via **AWS SAM** ([`template.yaml`](../template.yaml)).

1. Install [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) and **Docker**.
2. **`sam build`** once (or when Lambda code changes).
3. Either:
   - **One terminal:** `npm run dev:stack` — starts **`sam local`** on **3000** and **Vite** on **5173**, or
   - **Two terminals:** `npm run sam:local` then `npm run dev`.

If you only run **`npm run dev`**, Vite will log **`ECONNREFUSED 127.0.0.1:3000`** for `/api/*` until SAM local is listening.

Full detail: [infrastructure/aws-sam.md](./infrastructure/aws-sam.md).

## Path aliases

- `@/` → `src/` (see `vite.config.ts`, `tsconfig.app.json`).
- `@shared/` → `shared/` (DTOs shared with `api/`).
