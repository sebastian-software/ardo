# ADR 0019: Chroma Multipliers Next to Hues

## Status

Accepted. Amends [ADR 0010](0010-brand-color-via-single-hue.md).

## Context

ADR 0010 derives the whole palette from hue values, but every recipe fixed its chroma. Brands that
are calmer or more vivid than Ardo's default could not be expressed: Ardo's own documentation
replaced 66 generated colors by hand to get its muted owl palette, which left its hue values with
almost no effect. Neutral chrome could not be pure gray, so the `gray` and `slate` presets were the
same color.

ADR 0010 also promised that contrast would be preserved automatically. Nothing checked it. At the
fixed lightness, the light `teal` brand reached 4.26:1 as link text, and all five dark-mode callout
titles stayed between 2.8:1 and 3.4:1.

## Decision

Three chroma multipliers sit next to the three hues: `--ardo-chroma-brand`, `--ardo-chroma-accent`,
and `--ardo-chroma-neutral`, all `1` by default. Every hue-derived recipe scales its chroma by the
matching multiplier with `calc()`, so the multipliers work at runtime like the hue variables.

- `ardo({ brand: { chroma } })` takes a number (color and accent) or `{ color, accent, neutral }`.
- `applyBrandTheme({ chroma })` takes a number (brand and accent) or `{ brand, accent, neutral }`.
- Semantic colors (tip, warning, danger, info, note) keep fixed hues and are not scaled.

A contrast test resolves the recipes for every hue preset at default, muted, and boosted accent and
neutral chroma, in both modes, and requires WCAG AA for the text pairs the theme renders. The light
brand lightness dropped from 0.53 to 0.48 and the dark semantic colors were lightened to pass it.

## Consequences

- A brand like the owl palette needs three hues, one `chroma` object, and only the overrides that
  are real design choices.
- Brand chroma above `1` can push hues such as teal outside sRGB; the test covers accent and neutral
  boosts only, and the docs say so.
- Generated token strings now contain `calc(… * var(--ardo-chroma-…))`. Code that compared token
  strings must update.
