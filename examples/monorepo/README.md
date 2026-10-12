# Monorepo documentation reference

Use this project when one workspace owns several TypeScript packages and their documentation.

## Contract

- `packages/*/src` contains package APIs that the native compiler checks.
- `tsconfig.json` and `vite.config.ts` define the workspace-aware documentation build.
- `package.json` declares the native compiler alias and `oxc-parser` for API generation.
- `app/root.tsx` is an adaptation seam; preserve project-specific providers and UI.
- `app/routes.ts` and generated API routes are build output, not handwritten source.

## Validate

```bash
pnpm install
pnpm build
```
