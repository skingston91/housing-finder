# SAM local — Lambda environment

`npm run sam:local` and `npm run dev:stack` load **only** JSON from this folder into the Lambdas. **Root `.env` is not used** for SAM (Vite uses `.env` / `.env.local` for `VITE_*` only — see repo `.env.example`).

| File | Required | Purpose |
|------|----------|---------|
| **`env.json`** | **Yes** | Create with `cp env.json.example env.json` and edit. Gitignored. |
| **`env.local.json`** | No | Optional overrides (e.g. secrets); merged on top of `env.json`; gitignored. |

If **`env.json` is missing**, the script **exits with an error** (fail fast).

Optional: **`SAM_LOCAL_STRICT=1`** — require `SearchAreasFunction` to have **`TFL_APP_KEY`** or **`API_SECRETS_ARN`** set (so transit is not silently straight-line with no key).

See [docs/infrastructure/aws-sam.md](../docs/infrastructure/aws-sam.md) for full detail.
