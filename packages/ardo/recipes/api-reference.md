---
name: api-reference
description: Generate a TypeScript API reference from the public entry points of a project.
---

# Add the API reference

The `api` option generates Markdown pages from a project's public TypeScript entry points. Ardo writes them into the routes directory, so they build and ship with the rest of the site. The generator uses a pinned TypeScript 7.1 nightly. TypeScript 7.0 does not work.

## Check the existing setup

- Read `ardo.config.ts`. If `api` is already set, stop and report the configured entry points.
- Check `package.json` for `typescript` and `oxc-parser`. Pins from an earlier setup are replaced in the next step.

## Inspect the project

- Find the public entry points in `package.json` (`exports`, `main`, `types`). Usually this is `src/index.ts`. Subpath exports map to import paths.
- Find the TypeScript configuration that includes those entry points. Reuse `tsconfig.json`, or create a `tsconfig.api.json` that extends it and lists only the public graph:

  ```json
  {
    "extends": "./tsconfig.json",
    "files": ["src/index.ts"],
    "include": []
  }
  ```

- Check that `app/routes/api-reference` or the chosen `out` folder holds no handwritten pages. Ardo refuses to replace a nonempty folder without its generated-file marker.
- Note the package manager. With pnpm, a release-age policy may block the nightly. The TypeScript nightly and its platform packages then need an entry in `minimumReleaseAgeExclude`.

## Confirm the plan

State the entry points and their import paths, the TypeScript configuration, the output folder, the title, and the packages to install. Ask for confirmation before editing.

## Apply the change

1. Install the pinned compiler and parser:

   ```bash
   pnpm add -D typescript@7.1.0-dev.20261011.1 oxc-parser@^0.155.0
   ```

2. Add the option to `ardo.config.ts`:

   ```ts
   import { defineArdoConfig } from "ardo/config"

   export default defineArdoConfig({
     title: "My Docs",
     api: {
       entryPoints: ["./src/index.ts"],
       tsconfig: "./tsconfig.api.json",
     },
   })
   ```

   `api: true` uses `./src/index.ts` and `./tsconfig.json`. `out` defaults to `api-reference`, and `title` defaults to `API Reference`. For subpath exports, map import paths to entry points: `entryPoints: { "my-lib/ui": "./src/ui/index.ts" }`. For several packages, pass an array with distinct `out` folders.

3. Do not edit the generated pages. Keep handwritten content outside `out`.

## Verify

- Run `pnpm exec tsc --noEmit`. The project must typecheck with the pinned compiler.
- Run `pnpm build`. Generation runs before route discovery. A compiler error fails the build. The build must report no broken internal links.
- Check that `build/client/api-reference/index.html` exists, or the chosen `out` path.
- If `ardo check` is available in the installed version, run it.
