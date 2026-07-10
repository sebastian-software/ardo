# External content and collections reference

Use this project when Markdown is already owned outside `app/routes/` and a React page also needs the same frontmatter as static data.

## Contract

- `project-content/recipes/` is the canonical authored source.
- `collections` in `vite.config.ts` materializes those files as normal documentation routes.
- `app/routes/catalog.tsx` consumes the same build-time records from `virtual:ardo/collections`.
- `app/routes/recipes/` and `app/routes.ts` are generated; never edit them by hand.

## Validate

```bash
pnpm install
pnpm build
```
