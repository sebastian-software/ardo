# ADR 0020: Static Site Generation Without React Router

## Status

Accepted. Supersedes ADR 0001 and the React Router configuration parts of ADR 0002.

## Context

Ardo has used React Router Framework Mode since ADR 0001. A build profile of the docs site in
October 2026 showed that most of the framework's work is overhead for a documentation site:

- React Router evaluates the Vite config four times per build: for its config loader, a child
  compiler, the prerender server, and that server's child compiler.
- Its child compiler compiles every route again to detect route exports, and a Babel pass parses,
  rewrites, and regenerates every route module in the client and SSR builds.
- The SSR build exists only to prerender. Ardo never uses loaders, actions, `.data` files, the SPA
  fallback, or nested routes.

At the same time, Ardo already owns everything that makes the site: the route table from the file
system, page metadata, sidebars, search, sitemap, llms.txt, redirects, versioning, and the HTML
shell. What it needs from a router is small: the current path while rendering, a link that applies
the base path, and per-page layout flags.

Client-side navigation is the one capability React Router adds that a static site would lose. For
documentation it buys little: every page is prerendered HTML, version and locale switches already
load full pages, and browsers now prefetch and transition between documents on their own.

## Decision

Ardo 6 builds static sites with Vite alone and ships no client router.

### Build

- `ardo build` runs Vite's builder API in-process. It builds a `client` and an `ssr` environment,
  then renders every route to HTML in a `buildApp` step and checks the output's internal links.
- Each page loads the shared client entry and its own route chunk. The client entry hydrates the
  document, so components in Markdown and TSX stay interactive.
- The output directory mirrors the deployed URL space: assets and pages sit under the base path,
  site-wide files such as `robots.txt` and `versions.json` sit at the deployment root. The
  GitHub Pages flattening and the versioned asset move disappear.

### Development

- `ardo dev` starts a Vite dev server with SSR middleware. It renders the requested route through
  Vite's module runner and serves the same document the build would write.
- React Fast Refresh comes from `@vitejs/plugin-react`.

### Navigation

- Pages link with plain anchors. `ArdoLink` prefixes the base path to internal targets, and
  `ArdoNavLink` adds the active state. Both render an `<a>`.
- `useArdoPath()` returns the current page path without the base path. It replaces `useLocation()`.
- The output link check introduced alongside this work becomes the safety net that a router's
  typed routes would otherwise provide.

### Project files

- `app/routes/**` stays as is. Markdown, MDX, and TSX files are routes.
- `app/root.tsx` exports the root component as before. `Layout`, `meta`, and `ErrorBoundary`
  exports remain optional.
- Route modules keep `meta` and `handle` exports. `meta` uses the same descriptor objects as
  before, now typed as `ArdoMetaFunction`.
- `react-router.config.ts`, `entry.server.tsx`, `entry.client.tsx`, and the generated
  `app/routes.ts` go away. Ardo generates the route table as a virtual module.

### Public API

Removed: `ardo/router`, `ardo/router/dom`, `ardo/router/routes`, `ardo/entry.server`, the
`ReactRouterConfig` type, `withArdoGitHubPages`, `withArdoVersioning`, and `ardoRoutesPlugin`.
Link props that took React Router's `To` take a string.

## Consequences

### Benefits

- One config evaluation and two Vite builds per site, without a Babel pass.
- No framework-specific project files; a project is routes, a root component, and config.
- The base path is configured once. Versioned and GitHub Pages builds write their final layout
  directly.
- Ardo's runtime no longer depends on React Router's release cycle.

### Trade-offs

- Every link click loads a new document. Browser prefetching, Speculation Rules, and cross-document
  view transitions are the mitigation; Ardo can add them without changing the link API.
- Client state such as an open search box does not survive navigation.
- Ardo now owns the dev server's SSR path and must keep it on par with Vite's own guidance.
- This is a breaking change for every project. The migration removes files rather than rewriting
  them, which the upgrade guide documents.

### Not decided here

- Partial hydration or React Server Components. The renderer is the place to add either later.
- A typed route union for `ArdoLink`. The output link check covers broken links today.
