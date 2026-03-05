# ADR 0001: Migrate from TanStack Start to React Router 7

## Status

Accepted

## Context

Ardo used TanStack Start as its framework with TanStack Router for client-side routing. This choice introduced several problems:

- **Instability**: TanStack Start was under rapid development with frequent breaking changes.
- **Complex route generation**: The custom route pipeline had to generate TanStack-Router-specific files and constantly adapt to API changes.
- **Prerender issues**: The link crawler did not work reliably with base paths (e.g. GitHub Pages), since crawled links contained the Vite base prefix.
- **SSR limitations**: Missing native Suspense support required workarounds like `renderToReadableStream`.

React Router 7 (Framework Mode) offered a stable, proven API and native support for MDX as a route module format.

## Decision

Migrate the entire framework from TanStack Start to React Router 7 Framework Mode. MDX processing uses `@mdx-js/rollup` instead of a custom pipeline.

## Consequences

### Breaking changes

- Directory structure changes from `src/routes/` to `app/routes/`
- New entry files: `entry.client.tsx`, `entry.server.tsx`, `root.tsx`
- Configuration via `react-router.config.ts` instead of TanStack-specific config
- Routes plugin generates React Router compatible `routes.ts` instead of TanStack Router files

### Areas affected

- `packages/ardo/src/vite/plugin.ts` — Complete rewrite for React Router
- `packages/ardo/src/vite/routes-plugin.ts` — New output format
- `packages/ardo/src/ui/` — All components migrated to React Router Link/hooks
- `packages/create-ardo/templates/minimal/` — Scaffold template migrated
- `docs/` — Completely restructured to `app/` directory

### Benefits

- Stable, widely adopted framework with a large community
- MDX files as first-class route modules
- Native SSR/prerendering without custom implementation
- Simpler setup for end users
