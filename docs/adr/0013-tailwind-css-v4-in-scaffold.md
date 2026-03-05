# ADR 0013: Tailwind CSS v4 Support in Scaffold

## Status

Accepted

## Context

Ardo uses Vanilla Extract for its internal component styling (see ADR 0004), but users building custom pages and components on top of Ardo often prefer utility-first CSS for rapid development. Without built-in Tailwind support, users had to configure it manually and work around potential conflicts with Ardo's base styles and CSS layer ordering.

## Decision

Include Tailwind CSS v4 in the scaffold template by default. The `@tailwindcss/vite` plugin is positioned before `ardo()` in the Vite config, and `app.css` imports Tailwind's theme and utilities layers without Preflight to avoid conflicts with Ardo's base styles.

## Consequences

### Setup in scaffold

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    tailwindcss(), // Before ardo()
    ardo({ ... })
  ]
})
```

```css
/* app/app.css - imported before Ardo styles in root.tsx */
@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);
```

### Benefits

- Every new Ardo project ships with Tailwind ready to use from day one
- Clean separation: Ardo's design system (Vanilla Extract) for framework UI, Tailwind for user content
- No Preflight conflicts because `app.css` is imported before Ardo's `styles.css`
- Zero-configuration for the user

### Trade-offs

- Additional devDependencies in every scaffolded project
- Two styling approaches coexist (Vanilla Extract internal, Tailwind for users)
- Users who prefer other approaches can remove Tailwind from the scaffold
