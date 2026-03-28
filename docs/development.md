# Development

## Prerequisites

- Node **22+**, npm **10+** (see `package.json` `engines`).

## Install

```bash
npm install
```

## Scripts

| Script            | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `npm run dev`     | Vite dev server (default [http://localhost:5173](http://localhost:5173)) |
| `npm run build`   | Typecheck + production bundle to `dist/`                                 |
| `npm run preview` | Serve `dist/` locally                                                    |
| `npm run test`    | Vitest (unit/component)                                                  |
| `npm run lint`    | ESLint                                                                   |
| `npm run verify`  | Lint, format check, `tsc`, tests, build                                  |

## Environment variables

- Copy `.env.example` to `.env.local` for Vite. **Only** variables prefixed with `VITE_` are exposed to the browser.
- **Secrets** (routing APIs, TfL keys, etc.) belong in the **serverless** host (e.g. Vercel project settings), not in `VITE_*`.

## Serverless API locally

`npm run dev` does not run Vercel handlers. Use:

```bash
vercel dev
```

See [api/README.md](../api/README.md).

## Path alias

- `@/` → `src/` (see `vite.config.ts`, `tsconfig.app.json`).
