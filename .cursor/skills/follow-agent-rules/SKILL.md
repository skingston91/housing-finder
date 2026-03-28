---
name: follow-agent-rules
description: Checklist before finishing a task — verify script, lint, types, tests, docs.
---

# Follow agent rules

Before marking work complete:

1. `npm run lint` — clean
2. `tsc -b` — no errors
3. `npm run test` — pass
4. `npm run build` — pass (for UI changes)
5. Updated `docs/` if product, data sources, or setup changed
6. No `console.log` in production code paths
