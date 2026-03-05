# ADR 0002: Static Site Generation with Prerender Instead of SSR

## Status

Accepted

## Context

Documentation sites do not need server-side rendering at runtime. All content is known at build time since the routes plugin generates all routes from the file system.

When attempting to use SSR with link crawling, issues arose:

- **Base path conflicts**: The prerender crawler found links with the Vite base prefix (e.g. `/ardo/api-reference`) but could not resolve them internally since the dev server only knew routes without the prefix.
- **Unnecessary complexity**: Since all routes already exist in the route tree, crawling links was redundant.

## Decision

Ardo sites use `{ ssr: false, prerender: true }` in `react-router.config.ts`. Link crawling is disabled — all routes are prerendered directly from the generated route tree.

## Consequences

### Configuration

```ts
// react-router.config.ts
export default {
  ssr: false,
  prerender: true,
}
```

### Benefits

- Reliable prerendering regardless of base paths
- Simpler mental model: routes plugin defines all routes, no dynamic discovery
- No runtime server needed — purely static output
- Deployable to any static hosting service (GitHub Pages, Vercel, Netlify)

### Trade-offs

- No dynamic server-side rendering possible
- New pages require a rebuild
- For pure documentation this is not a disadvantage
