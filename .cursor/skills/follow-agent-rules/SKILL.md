---
name: follow-agent-rules
description: Ensures the agent follows project agent rules and development standards. Use before considering a task complete, when implementing features, when reviewing code, or when the user asks to verify or enforce rule compliance.
---

# Follow Agent Rules

Use this skill to **ensure the agent rules are followed**. Verify compliance with **Cursor rules** (`.cursor/rules/`) and **Development Standards** (`.agentrules/`). Run the checklist before marking any feature or refactor done.

## When to Apply

- **Before considering a task complete** — Run the checklist.
- **When implementing a new feature** — Follow the workflow and standards.
- **When the user asks** — e.g. “check the rules”, “ensure compliance”.
- **When reviewing code** — Use the checklist to validate changes.

## Rule Sources

| Source | Purpose |
|--------|--------|
| `.cursor/rules/new-features-workflow.mdc` | Subagent order; verifier for substantive changes |
| `.cursor/rules/clean-code.mdc` | Clean Code on every edit |
| `.agentrules/index.md` | TDD, testing, TypeScript, structure, before-commit |
| `.cursor/skills/typescript/SKILL.md` | Strict typing, return types, `import type`, indexed access |

See [reference.md](reference.md) for paths to all rule files.

## Compliance Checklist

### Workflow

- [ ] **Designer first** — For new UX, a design spec exists under `docs/design/` (see `.cursor/agents/designer.md`) before large implementation swings.
- [ ] **Verifier** — For substantive changes, run `npm run verify` or invoke verifier; fix failures before done.

### Testing

- [ ] **Data generators** — Prefer `src/test/dataGenerators/` (e.g. `createRankedArea`) over static fixtures; assert on generated values.
- [ ] **New API routes** — Add Lambda handlers under `lambda/`, update `template.yaml`, document local `sam local` in `docs/infrastructure/aws-sam.md`, test client integration.

### TypeScript and build

- [ ] **No `any`** — Strict typing unless documented exception.
- [ ] **`tsc -b` / `npm run build`** — Passes before calling work complete.

### Clean Code

- [ ] Names, small functions, explicit errors, readable tests (see `.cursor/skills/clean-code/SKILL.md`).

### Before commit

- [ ] Tests pass; ESLint clean; no `console.log` in production paths.
- [ ] **`docs/`** updated when product decisions, data sources, or setup change.

## Subagent context

When invoking subagents, pass: requirements, relevant paths (`src/`, `shared/`, `api/`, `docs/`), data-generator rule, acceptance criteria.

## Quick commands

- `npm run verify` — lint, format, `tsc`, test, build
- `npm run dev` — Vite on port 5173
- `npm run sam:local` — Local API Gateway + Lambda (see `docs/infrastructure/aws-sam.md`)

## If something fails

Fix build/tests/lint before considering complete; use **debugger** subagent for stubborn failures.
