---
name: playwright-cli
description: Token-efficient browser automation via Playwright CLI. Use when verifying flows, generating E2E tests, or exploring the app in a browser. Prefer over Playwright MCP for coding-agent workflows.
---

# Playwright CLI

## When to use

- Verify a user flow works in the browser
- Generate Playwright test code from interactions
- Exploratory testing of new features
- Reproduce a bug in the browser

## Project context

- **Base URL**: `http://localhost:5173` (Vite) or `http://localhost:3000` when hitting the API directly with `sam local` alone
- **Start dev server first**: `npm run dev` (and `npm run sam:local` on port 3000 if testing `/api/*` via Vite proxy)
- **Invoke via**: `npx playwright-cli` (add as devDependency if not installed) or global `playwright-cli`

## Quick workflow

1. `npx playwright-cli open http://localhost:5173`
2. `npx playwright-cli snapshot` → get element refs (e1, e2, ...)
3. `npx playwright-cli click e5` / `npx playwright-cli type "text"` etc.
4. `npx playwright-cli screenshot` for evidence
5. `npx playwright-cli run-code` for custom Playwright snippets

## Key commands

| Command | Purpose |
|---------|---------|
| `open [url]` | Open browser, optionally navigate |
| `goto <url>` | Navigate to URL |
| `snapshot` | Capture page snapshot, get element refs |
| `click <ref>` | Click element by ref (e.g. e21) |
| `type <text>` | Type into focused editable |
| `fill <ref> <text>` | Fill editable by ref |
| `screenshot [ref]` | Screenshot page or element |
| `run-code <code>` | Execute Playwright code snippet |

Run `npx playwright-cli --help` for full command list.

## Sessions

Use `-s=housing-finder` for a named session, or `PLAYWRIGHT_CLI_SESSION=housing-finder` when invoking the agent. Sessions keep browser state between commands.

## Tool choice

- **Playwright CLI** (this): Token-efficient; prefer for flows, test generation, exploratory automation.
- **Chrome DevTools MCP**: Prefer for debugging layout, console, network, Lighthouse.
- **Playwright MCP**: Use when persistent browser state and rich introspection outweigh token cost.
