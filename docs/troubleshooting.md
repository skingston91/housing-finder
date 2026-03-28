# Troubleshooting log

Add a dated entry when you hit a non-obvious issue and fix it. Short bullets are enough.

## Template

```
### YYYY-MM-DD — Short title
- **Symptom:**
- **Cause:**
- **Fix:** (command, file, or doc link)
```

---

### 2026-03-28 — Initial scaffold

- **Symptom:** N/A (greenfield).
- **Cause:** N/A.
- **Fix:** Repo created with Vite + React + Chakra, Vitest, `api/` serverless stub, and docs above.

### 2026-03-28 — Search returns network / fetch error in dev

- **Symptom:** UI shows “Search error” when clicking Search with Vite only.
- **Cause:** `/api/*` is implemented by **AWS Lambda** (local emulation), not by Vite.
- **Fix:** Run `npm run sam:build` and `npm run sam:local` (port 3000) alongside `npm run dev` so the Vite proxy can reach the API. Requires **Docker** and **SAM CLI**. See [infrastructure/aws-sam.md](./infrastructure/aws-sam.md).

### 2026-03-28 — `npm install` audit noise

- **Symptom:** `npm install` reports moderate/high vulnerabilities (often transitive dev tooling).
- **Cause:** Dependency tree includes dev/build-time packages with known advisories.
- **Fix:** Run `npm audit` for detail; apply `npm audit fix` where safe. Re-audit after upgrades; do not use `--force` without reviewing breaking changes.

### 2026-03-28 — SAM `sam build` / Handler errors

- **Symptom:** Build fails or Lambda cannot find handler.
- **Cause:** `Handler` in `template.yaml` must match the **esbuild entry file** basename and exported name (`handler`).
- **Fix:** See [infrastructure/aws-sam.md](./infrastructure/aws-sam.md); confirm `lambda/*.ts` uses `export const handler`.
