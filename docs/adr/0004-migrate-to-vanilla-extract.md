# ADR 0004: Migrate to Vanilla Extract

## Status

Accepted

## Context

All UI styling lived in a monolithic `styles.css` with ~2,800 lines. CSS classes were hardcoded as magic strings (`ardo-*`, `ardo-home-*`) in components. This caused:

- **No type safety**: Typos in class names were only caught at runtime.
- **Poor discoverability**: Styles and components were completely separated — it was unclear which styles belonged to which component.
- **No design token system**: Colors, spacing, and typography were scattered as raw values.
- **Difficult maintenance**: Changes to a component required searching through a 2,800-line file.

## Decision

Migrate all styles to Vanilla Extract with co-located `.css.ts` files next to each component. Introduce a design token system via `ardo/theme` with contract definitions, light/dark themes, and reset styles.

## Consequences

### Scope

- **30+ new `.css.ts` files** created (Footer, Header, Sidebar, CodeBlock, Tabs, Hero, Features, etc.)
- **`styles.css` deleted** (2,800 lines)
- **Design token system** introduced: `contract.css.ts`, `light.css.ts`, `dark.css.ts`, `reset.css.ts`, `animations.css.ts`
- **lucide-react** replaces custom CSS mask icons
- Vanilla Extract plugin automatically integrated into `ardo()`

### Benefits

- Type-safe styles — CSS classes are TypeScript identifiers
- Co-location — styles live directly next to their components
- Design tokens accessible to consumers via `ardo/theme`
- Optimized, scoped CSS output
- Short class identifiers in production builds

### Trade-offs

- Users writing custom `.css.ts` files need `@vanilla-extract/vite-plugin`
- Learning curve for Vanilla Extract API
- Build-time CSS instead of runtime — no dynamic styling
