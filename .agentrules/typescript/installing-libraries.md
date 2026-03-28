# Installing libraries and npm dependencies

## Policy: avoid casual new packages

Do **not** add npm packages unless there is a clear, reviewed need. Prefer standard APIs, existing dependencies, workspace packages (`packages/`, `@game-collection/contract`), and small **in-repo** modules over pulling in another transitive tree.

When a third-party site has no stable public API, a **maintained local client** (thin `fetch` + documented endpoints) is often better than an abandoned npm scraper.

Before adding a dependency, confirm: **no suitable built-in**, **no overlap** with existing deps, **active maintenance** and acceptable license, and **proportionate** size/risk for the use case.

## Versions and install commands

Do not rely on training-data cut-off for version numbers. **Do not** hand-edit `package.json` with guessed versions.

When a new dependency **is** justified, install with npm so the lockfile captures the resolved tree:

```bash
npm install --save-dev @typescript-eslint/eslint-plugin
```

Use the correct working directory for this monorepo (repository root, `api/`, or a `packages/*` package as appropriate). Commit `package-lock.json` (and workspace lockfiles if any) with the change.

## Cleanup

When removing a feature, remove **unused** dependencies from the relevant `package.json` and refresh the lockfile.
