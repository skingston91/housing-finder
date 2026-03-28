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
- **Cause:** `POST /api/search-areas` is implemented as a serverless function; Vite does not serve it unless proxied to `vercel dev`.
- **Fix:** Run `vercel dev` on port 3000 (see `vite.config.ts` `server.proxy`) alongside `npm run dev`, or use `vercel dev` alone per [development.md](./development.md).

### 2026-03-28 — `npm install` audit noise

- **Symptom:** `npm install` reports moderate/high vulnerabilities (often transitive via tooling such as `@vercel/node`).
- **Cause:** Dependency tree includes dev/build-time packages with known advisories.
- **Fix:** Run `npm audit` for detail; apply `npm audit fix` where safe. Re-audit after upgrades; do not use `--force` without reviewing breaking changes.
