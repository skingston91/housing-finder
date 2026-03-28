---
name: performance
description: Applies React and JavaScript performance rules from project agent rules. Use when implementing or reviewing code for performance, optimizing re-renders, async flows, bundle size, memory, or when the user asks for performance improvements or audits—including analysis with Chrome DevTools (Performance, Memory, Network, etc.).
---

# Performance

Apply this skill when implementing or reviewing code for **performance**. Rules follow `.agentrules/typescript/generic/performance/` (index, react, javascript). Optimize by impact: CRITICAL first, then HIGH, MEDIUM, LOW.

## When to Apply

- **Implementing features** — Especially lists, context, async data, or route-heavy apps.
- **Performance audits or reviews** — Use the checklist and priority order; validate with **Chrome DevTools** (and React Profiler) when investigating real-world jank, memory, or load.
- **User asks** — e.g. “optimize performance”, “reduce re-renders”, “fix slow list”, “bundle size”, “analyze in Chrome”, “long tasks”, “memory leak”.
- **After bugs** — e.g. setState after unmount, listeners not cleaned up.

## Priority Framework

| Impact   | Focus |
|----------|--------|
| **CRITICAL** | Async waterfalls; bundle/code splitting; re-renders (memo, useCallback, stable props). |
| **HIGH**     | Lazy state init; memoized filters/expensive calcs; context split + memoized values; Set/Map lookups. |
| **MEDIUM**   | useEffect deps; cleanup (listeners, timeouts, RAF); avoid unnecessary object/array creation. |
| **LOW**      | Stable keys; avoid inline objects/functions in list items; virtualization for long lists; debounce/throttle. |

## Quick Rules

### Async

- **Parallelize** independent async work: `await Promise.all([fetchA(), fetchB()])`.
- **Conditional async**: only `await` when the result is needed (no fetch-then-return-early).
- **useEffect**: avoid cascading effects (A then B); fetch in parallel when inputs allow.

### React

- **Lazy state**: `useState(() => expensiveOrParse())` for heavy init (e.g. JSON from storage).
- **Expensive calculations**: `useMemo(() => compute(x), [x])`; keep dependency stable (e.g. memoize `filters` so `filteredGames` useMemo is stable).
- **Stable callbacks**: `useCallback` for handlers passed to list children or memoized components.
- **Memoize list items**: `React.memo` on components rendered in lists (e.g. area result rows) when parent re-renders often.
- **Context**: Prefer split contexts; memoize provider `value` with `useMemo`; avoid one giant context that re-renders all consumers.
- **Bundle**: Route-level or feature-level code splitting with `React.lazy` + `Suspense`; dynamic import for heavy libs; import only what you need (e.g. `lodash/debounce`).

### JavaScript

- **Lookups**: Use `Set`/`Map` for repeated membership checks (e.g. “is id in collection”).
- **Loops**: Prefer single-pass where multiple passes over the same array can be combined.
- **Memory**: Clean up event listeners, timeouts, and RAF in useEffect return; avoid setState after unmount (use cancelled flag); limit cache size or use WeakMap where appropriate.
- **Lists**: Virtualize long lists (e.g. `@tanstack/react-virtual`); avoid inline style/callback in each row.

### Large result sets (area / listing lists)

When **many ranked areas** or rows render at once: debounce search-triggering inputs, **virtualize** long lists (`@tanstack/react-virtual` or similar) if needed, and avoid recalculating scores on every keystroke — commit criteria then fetch or recompute.

Add a short audit note under `docs/` when you introduce heavy filters or maps.

## Performance Checklist

Before considering performance work complete:

- [ ] No async waterfalls; conditional async only when needed.
- [ ] Routes or heavy features use `React.lazy` / code splitting where appropriate.
- [ ] `useState` uses function initializer for expensive or parse-once init.
- [ ] Expensive derived state (e.g. filtered list) uses `useMemo` with stable deps (e.g. memoized filters).
- [ ] Handlers passed to list children or memoized components use `useCallback`.
- [ ] List item components (e.g. area cards) use `React.memo` where parent re-renders often.
- [ ] Context values are memoized; consider splitting one large context.
- [ ] useEffect dependency arrays are correct; cleanup runs (listeners, timeouts, RAF).
- [ ] No setState after unmount (e.g. cancelled flag in async flows).
- [ ] Frequent lookups use Set/Map; long lists are virtualized when needed.

## Monitoring & analysis

Use a mix of tools; pick what matches the symptom (jank, memory, load time, bundle).

### Chrome DevTools (Chromium)

Use **Chrome** (or Edge) DevTools for **runtime** behavior in a real browser—complements React Profiler and build tools.

| Panel | Use for |
|-------|---------|
| **Performance** | Record a short interaction or page load. Inspect **Main** thread (long tasks, scripting, layout, paint), **Frames**, and **Interactions**. Look for forced sync layout, excessive scripting, or long tasks blocking input. Use **Screenshots** and **Web Vitals** (when shown) to tie spikes to UX. |
| **Memory** | Heap snapshots to find **retainers** and leaks (detached DOM, growing listeners). **Allocation sampling** over a scenario that should return memory to baseline. |
| **Network** | Waterfall: parallel vs sequential requests, payload size, caching. Throttle CPU/network to approximate slow devices. |
| **Coverage** (Ctrl/Cmd+Shift+P → “Coverage”) | See **unused JS/CSS** after a flow—candidates for code splitting or lazy routes. |
| **Rendering** (⋮ → More tools → **Rendering**) | **Frame rendering stats**, paint flashing, layer borders—useful for scroll/list jank and compositor issues. |
| **Lighthouse** (built-in or DevTools **Lighthouse** tab) | Lab metrics (LCP, TBT, CLS), opportunities and diagnostics—good for a structured pass on a URL. |

**Workflow tips:** Reproduce with **CPU throttling** and **Disable cache** when debugging “feels slow” reports. For React, combine **Performance** recording with **React DevTools Profiler** on the same interaction to connect long frames to specific components.

### Other tools

- **React DevTools** — **Profiler** tab: commit frequency, component render times, why a component rendered (“did not render” vs wasted renders).
- **Performance API** (`performance.mark` / `measure`) — narrow timing around critical paths in code when DevTools sampling is too coarse.
- **Build** — Vite/Rollup bundle analysis when chunk size grows (e.g. manual chunks, lazy routes).
- **Lighthouse** (CI or CLI) — repeatable audits; pair with DevTools for deep dives.

## Full Rules

For detailed patterns, code examples, and edge cases, see:

- **Index & priority**: `.agentrules/typescript/generic/performance/index.md`
- **React**: `.agentrules/typescript/generic/performance/react.md`
- **JavaScript**: `.agentrules/typescript/generic/performance/javascript.md`

Add `docs/performance-*.md` when you run a focused audit on search, maps, or long lists.
