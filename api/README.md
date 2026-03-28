# Serverless API (Vercel-style)

Handlers in this folder are intended to run as **serverless functions** so API keys and heavy aggregation stay off the client.

## Local development

- Install [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- From repo root: `vercel dev` — serves the Vite app and mounts `/api/*` routes.

The Vite-only command `npm run dev` does **not** expose these routes unless proxied; use `vercel dev` when working on API handlers.

## Routes

| File | Method | Path |
|------|--------|------|
| `health.ts` | GET | `/api/health` |
| `search-areas.ts` | POST | `/api/search-areas` |

## Adding routes

- One file per route, e.g. `api/health.ts` → `GET /api/health`
- Keep handlers thin: validate input, call use-case services, return JSON
- Document new env vars in `docs/development.md` and `.env.example` (never commit secrets)
