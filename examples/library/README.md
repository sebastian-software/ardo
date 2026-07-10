# Library documentation reference

Use this project when a TypeScript library needs guide pages and generated API reference.

## Contract

- `src/index.ts` is the small public API that TypeDoc reads.
- `tsconfig.api.json` defines the API-documentation compiler boundary.
- `vite.config.ts` enables Ardo TypeDoc generation.
- `app/routes.ts` and generated API routes are build output, not handwritten source.

## Validate

```bash
pnpm install
pnpm build
```
