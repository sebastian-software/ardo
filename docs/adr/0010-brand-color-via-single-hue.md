# ADR 0010: Brand Color via Single Hue Value

## Status

Accepted

## Context

Color theming required manual specification of numerous individual values (brand, brandLight, brandDark, backgrounds, text, borders, etc.) in OKLCH. Users had to maintain complex color relationships (contrast, lightness, chroma) for both light and dark mode manually. The barrier to entry for simple branding was disproportionately high.

## Decision

A single OKLCH hue value (0–360) generates the complete color palette for light and dark mode via `createTheme(brandHue)`. For the simplest case, `applyBrandTheme(hue)` is provided.

## Consequences

### Usage

```ts
import { applyBrandTheme } from "ardo/theme"

// Simplest form
applyBrandTheme(240) // Blue

// Advanced
import { createTheme } from "ardo/theme"
const theme = createTheme(290) // Purple
```

### Hue reference

| Hue | Color          |
| --- | -------------- |
| 30  | Orange         |
| 60  | Yellow         |
| 140 | Green          |
| 170 | Teal (default) |
| 240 | Blue           |
| 290 | Purple         |
| 330 | Pink           |

### Benefits

- One parameter instead of dozens of color values
- Guaranteed design system coherence — contrast and lightness relationships automatically preserved
- Light/dark mode tokens consistently derived
- Low barrier to entry for brand customization

### Trade-offs

- Less control over individual color nuances in the default mode
- For full control, `createTheme()` with extended options is available
