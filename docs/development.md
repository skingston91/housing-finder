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

## Environment variables

- Copy `.env.example` to `.env.local` for Vite. **Only** variables prefixed with `VITE_` are exposed to the browser.
- **Secrets** (routing APIs, TfL keys, etc.) belong in **Lambda environment variables** or **AWS Secrets Manager**, not in `VITE_*`.

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
