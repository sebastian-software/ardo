# Product documentation reference

Use this project as the smallest reference for product or internal documentation in a React app.
Use Node.js 22.22 or newer.

## Contract

- `ardo.config.ts` owns optional site metadata, theme, and integration settings.
- The Ardo CLI supplies the build integration; no Vite config is needed for this project.
- `react-router.config.ts` owns React Router prerendering.
- `app/root.tsx` is the application seam for Ardo UI; adapt it rather than replacing a customized root.
- `app/routes.ts` is generated and must not be edited by hand.
- Markdown and MDX under `app/routes/` are the authored documentation boundary.

## Validate

```bash
pnpm install
pnpm build
```
