# Internal regression fixtures

Only `examples/basic` is a public setup reference. These fixtures preserve
feature-specific inputs without adding more starter projects.

`tests/integration/examples/project.ts` copies Basic into a temporary directory,
applies an overlay, and uses that fixture's installed dependencies. The packed
consumer suite installs Basic and the native API overlay outside the workspace.

- `native-api/`: complex TypeScript declarations and their generated Markdown/HTML.
- `multiple-api-projects/`: separate TypeScript configurations and output prefixes.
- `content-sources/`: external Markdown, collection schema, and a React data consumer.
- `github-pages/`: subpath links, assets, prerendering, and flattened static output.
- `sitemap/`: TSX route exclusions that preserve pages and sibling sitemap entries.
- `runtime/`: a standalone internal app for shared-runtime hydration, bundled SSR,
  stylesheet ownership, and bare layouts with custom chrome.

The API fixture manifests declare optional compiler peers for workspace
installation. Other overlays reuse Basic's dependencies. Runtime is also served
directly by browser tests and therefore has its own small app shell.

Run from the repository root:

```bash
pnpm build
pnpm test:integration
pnpm test:e2e:examples
ARDO_EXAMPLE_BROWSER_SERVER=preview pnpm test:e2e:examples
```

Install Chromium with `pnpm exec playwright install chromium` if it is not
already available. The main `pnpm test:e2e` command remains scoped to the docs
site and version snapshots.
