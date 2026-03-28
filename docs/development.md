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
- **Secrets** (routing APIs, TfL keys, etc.) belong in the **serverless** host (e.g. Vercel project settings), not in `VITE_*`.

## Serverless API locally

Handlers live in [`api/`](../api/). Recommended:

1. Terminal A: `vercel dev` (often [http://localhost:3000](http://localhost:3000) — serves API and can serve the front end depending on project config).
2. Terminal B: `npm run dev` — Vite proxies `/api/*` to port **3000** so `postSearchAreas` can call `/api/search-areas`.

If only Vite runs, search will fail until `vercel dev` is up (or change proxy target).

See [api/README.md](../api/README.md).

## Path aliases

- `@/` → `src/` (see `vite.config.ts`, `tsconfig.app.json`).
- `@shared/` → `shared/` (DTOs shared with `api/`).
