# Development

## Prerequisites

- Node **22+**, npm **10+** (see `package.json` `engines`).

## Install

```bash
npm install
```

## Scripts

| Script            | Purpose                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`     | Vite ([http://localhost:5173](http://localhost:5173)); proxies `/api/*` → [http://127.0.0.1:3000](http://127.0.0.1:3000) when a backend listens there |
| `npm run build`   | Typecheck + production bundle to `dist/`                                                                                                              |
| `npm run preview` | Serve `dist/` locally                                                                                                                                 |
| `npm run test`    | Vitest (unit/component)                                                                                                                               |
| `npm run lint`    | ESLint                                                                                                                                                |
| `npm run verify`  | Lint, format check, `tsc`, tests, build                                                                                                               |

## Environment variables

- Copy `.env.example` to `.env.local` for Vite. **Only** variables prefixed with `VITE_` are exposed to the browser.
- **Secrets** (routing APIs, TfL keys, etc.) belong in **Lambda environment variables** or **AWS Secrets Manager**, not in `VITE_*`.

## Serverless API locally (AWS SAM)

Handlers live in [`lambda/`](../lambda/) and deploy via **AWS SAM** ([`template.yaml`](../template.yaml)).

1. Install [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) and **Docker**.
2. Terminal A: `npm run sam:build` then `npm run sam:local` — emulates API Gateway + Lambda on port **3000**.
3. Terminal B: `npm run dev` — Vite proxies `/api/*` to port **3000**.

If only Vite runs, search will fail until `sam local` is up.

Full detail: [infrastructure/aws-sam.md](./infrastructure/aws-sam.md).

## Path aliases

- `@/` → `src/` (see `vite.config.ts`, `tsconfig.app.json`).
- `@shared/` → `shared/` (DTOs shared with `api/`).
