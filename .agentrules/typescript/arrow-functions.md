# Arrow functions

Prefer **arrow functions** for all function definitions so the codebase stays consistent.

## Rule

- **Components:** `const ComponentName = (props) => { ... }` or `const ComponentName = () => <div />`
- **Helpers and callbacks:** `const fn = (arg: T): ReturnType => { ... }`
- **Exports:** `export const fn = (arg: T): ReturnType => { ... }` (not `export function fn()`)

Use a regular **`function` declaration** only when you need a named function that references itself before declaration (e.g. recursion where the name is used inside the body and must be hoisted). Prefer arrow + `const` everywhere else.

## Examples

```ts
// ✅ Preferred
const formatDate = (date: Date | null): string => (date ? date.toISOString().slice(0, 10) : '—');
export const getApiBase = (): string => env('REACT_APP_API_BASE') ?? '';

// ❌ Avoid (use arrow for consistency)
function formatDate(date: Date | null): string { ... }
export function getApiBase(): string { ... }
```
