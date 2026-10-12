# Library documentation reference

Use this project when a TypeScript library needs guide pages and generated API reference.

## Contract

- `src/index.ts` is the small public API read by the native TypeScript compiler.
- `tsconfig.api.json` defines the API-documentation compiler boundary.
- `vite.config.ts` enables Ardo's opt-in native API documentation integration.
- `package.json` declares both optional API peers: the native compiler alias and `oxc-parser`.
- `app/routes.ts` and generated API routes are build output, not handwritten source.

The public API also includes documentation-oriented fixtures: composed readonly
options, inherited component props, dictionaries, callable aliases and overloads,
and preserved union/indexed leaf types. They exercise native declaration
extraction and rendering.

## Validate

Build Ardo at the repository root before running this example.

```bash
pnpm install
pnpm build
```

The normal Vite build generates 12 API pages in `app/routes/api-reference/` and prerenders their
HTML. Development generation and updates also run through the Vite integration:

```bash
pnpm dev
```

To exercise the programmatic `ardo/api` entry point independently, run:

```bash
node prebuild-declarations.mjs
```

Both paths use the official TypeScript Node client with the pinned native
compiler and emit checked declarations with retained JSDoc in memory. A separate
prebuild step is not required for `pnpm dev` or `pnpm build`. The integration
tests verify the normal build's HTML, inherited descriptions, callable
documentation, and preserved type expressions on Node.js 22, 24, and 26.
