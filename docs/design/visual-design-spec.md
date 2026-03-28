# Visual design spec (housing-finder)

Light, marketing-style shell inspired by [Jitty](https://jitty.com/): plenty of **whitespace**, **clear hierarchy**, **soft neutrals**, **one strong accent** (blue) for primary actions.

## Surfaces

- **Page:** `gray.50` or Chakra `bg` semantic equivalent when themed.
- **Panels / cards:** `white`, border `gray.200`, radius `xl`, subtle `shadow="sm"`.

## Typography

- **H1:** `size="3xl"`, semibold, slightly tight letter-spacing.
- **Section titles:** `Heading size="md"`.
- **Body:** default `fg`; **secondary** `fg.muted` or `gray.600`.

## Components

- **Buttons:** `colorPalette="blue"` for primary.
- **Inputs:** full width in grid cells; consistent vertical rhythm `gap={4}`.
- **Badges:** score emphasis on result cards (`colorPalette="blue"`).

## Motion

- Default Chakra transitions only; avoid distracting animation on data-heavy views.

When the design system grows, align Chakra **semantic tokens** in `src/theme/theme.ts` and reference this file from `.cursor/agents/designer.md`.
