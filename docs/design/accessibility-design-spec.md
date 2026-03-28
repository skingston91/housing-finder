# Accessibility design spec

Target **WCAG 2.1 AA** for core flows (search criteria + results).

## Requirements

- **Contrast:** body text and labels meet AA against chosen background (light theme: dark text on white/gray-50).
- **Focus:** visible focus rings on interactive elements (Chakra defaults + avoid removing outline).
- **Forms:** every input has an accessible name (`aria-label` or visible label association).
- **Headings:** logical order `h1` → `h2`/`h3` in results.
- **Errors:** exposed in `Alert` with clear title and description; not color-only.
- **Maps (future):** provide list alternative and non-color-only cues for rankings.

## Keyboard

- Tab through criteria in reading order; **Search** activatable via keyboard.
- Result cards should not trap focus; links/buttons inside cards remain reachable when added later.
