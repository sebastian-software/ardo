# Basic Ardo example

A small static documentation site with Markdown/MDX, built-in search, and an
interactive React counter. Use Node.js 22.22 or newer.

## Run in this repository

From the repository root:

```bash
pnpm install
pnpm build
pnpm --dir examples/basic dev
```

Build and preview this site with:

```bash
pnpm --dir examples/basic build
pnpm --dir examples/basic preview
```

The static site is written to `build/client/` inside the example.

## Copy into your own project

1. Copy this directory from the `ardo-v<version>` tag matching your selected
   Ardo release. During Ardo development, use the same checkout revision.
2. Replace `ardo: workspace:*` in `package.json` with that exact released version.
3. With pnpm, add this minimal `pnpm-workspace.yaml` in the copied project:

   ```yaml
   packages:
     - "."
   allowBuilds:
     esbuild: true
   ```

4. Run `pnpm install`, `pnpm exec tsc --noEmit`, and `pnpm build`. Use `pnpm dev`
   to edit the site and `pnpm preview` to inspect its production output.

Use your project's own lockfile. The example's Ardo dependency manages React,
React Router, and Vite; TypeScript is only a development tool.

## Files to edit

- `app/routes/` contains authored Markdown, MDX, and React pages.
- `app/Counter.tsx` is a small interactive React component.
- `app/root.tsx` configures the header, navigation, sidebar, and footer.
- Optional `ardo.config.ts` sets the title and site options. This example serves
  from the domain root; select the deployment settings for your host.
- `react-router.config.ts` enables static prerendering.
- `app/entry.server.tsx` delegates rendering to Ardo. React Router supplies the
  default client entry.
- `tsconfig.json` configures TypeScript and Ardo's shared React runtime.

`app/routes.ts` and `build/` are generated. Do not edit them by hand.

## Optional features

Add [API documentation](https://ardo-docs.dev/v6/guide/api-documentation),
[external content or collections](https://ardo-docs.dev/v6/guide/content-sources),
or [deployment settings](https://ardo-docs.dev/v6/guide/deployment) to this same
setup. The [Basic Example guide](https://ardo-docs.dev/v6/guide/reference-projects)
explains the common package boundary and configuration choices.
