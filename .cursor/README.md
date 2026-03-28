# Cursor configuration

- **Agents** — `agents/*.md` (designer, architect, verifier, …)
- **Rules** — `rules/*.mdc` (always-apply and workflow)
- **Skills** — `skills/*/` — typescript, clean-code, performance, playwright-cli, follow-agent-rules, architect, tpm (self-contained; references `.agentrules/typescript/`)

Invoke agents via Cursor **Task** / subagents per project convention.
