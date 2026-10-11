# Library documentation reference

Use this project when a TypeScript library needs guide pages and generated API reference.

## Contract

- `src/index.ts` is the small public API that TypeDoc reads.
- `tsconfig.api.json` defines the API-documentation compiler boundary.
- `vite.config.ts` enables Ardo TypeDoc generation.
- `app/routes.ts` and generated API routes are build output, not handwritten source.

The public API also includes documentation-oriented fixtures: composed readonly
options, inherited component props, dictionaries, callable aliases and overloads,
and preserved union/indexed leaf types. They exercise the opt-in declaration
documentation path alongside TypeDoc.

## Validate

```bash
pnpm install
pnpm build
```

After building Ardo at the repository root, generate the declaration reference
with native TypeScript 7:

```bash
ARDO_DECLARATION_TSC=/path/to/typescript-7/bin/tsc node prebuild-declarations.mjs
pnpm build
```

The script emits declarations with retained JSDoc and generates 12 pages in
`app/routes/api-declarations/`. `--workspace-compiler` explicitly permits the
workspace compiler for comparison. The integration tests generate these pages
before building and verify their HTML, inherited descriptions, callable
documentation, and preserved type expressions. CI uses native TypeScript on
Node.js 24 and the workspace compiler on Node.js 22 and 26.
