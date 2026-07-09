# Ardo 4.0 Roadmap Milestone Plan

Date: 2026-07-09
Status: Milestone plan

## Goal

Ardo 4.0 should use the breaking-release window to stabilize the parts of the docs
architecture that would otherwise force another URL-breaking release in 5.0. The core goal is not
to ship every roadmap feature at once. The goal is to make versioned URLs, future localized URLs,
route identity, metadata, search records, and static deployment behavior agree on one model.

The stable URL contract should be:

- without i18n: `/v3/guide/getting-started`
- with i18n enabled in a later slice: `/v3/en/guide/getting-started`

Version comes before locale because the version identifies the documentation contract. Locale is a
representation of that version. Once i18n exists, the default locale should also be visible in the
canonical URL. That keeps `/v3/en/...` and `/v3/de/...` symmetric, avoids a special default-locale
hole, and reduces the chance of another breaking URL change later.

Search 2.0, content metadata, external content sources, and the future extension API should build on
that route identity instead of introducing their own path logic.

## Issue Scope

This plan covers the following roadmap issues:

- [#78 Documentation versioning support](https://github.com/sebastian-software/ardo/issues/78)
  becomes the 4.0 version routing and deployment contract. The first-class scope is stable major
  version folders, root redirects, `versions.json`, version-aware metadata, and predictable selector
  behavior.
- [#79 i18n / internationalization support](https://github.com/sebastian-software/ardo/issues/79)
  is included as URL-design preparation only. 4.0 should reserve the version-plus-locale shape and
  make internal route identity locale-ready, but it does not need translation automation, fallback
  rendering, RTL polish, or a public language switcher.
- [#195 Search 2.0 with section-level results, snippets, and provider adapters](https://github.com/sebastian-software/ardo/issues/195)
  is the main user-facing quality feature to build after route identity exists. Search must remain
  fully static and self-hostable.
- [#196 Schema-backed content collections and typed docs data](https://github.com/sebastian-software/ardo/issues/196)
  and [#204 Content source mapping](https://github.com/sebastian-software/ardo/issues/204) provide
  the metadata and source-ingestion layer. #204 can ship as a narrow pre-collections feature, but it
  must feed the same normalized metadata model that #196 will later grow.
- [#197 Public extension API](https://github.com/sebastian-software/ardo/issues/197) should be
  prepared internally, not published broadly in 4.0. The 4.0 work should reveal lifecycle seams and
  keep built-in integrations modular, without committing to a public third-party extension contract
  too early.

## Milestones

### M0: Route Identity Contract

Introduce an internal route identity model used by scanners, generated metadata, build outputs, and
runtime UI helpers:

```ts
type RouteIdentity = {
  versionId?: string
  localeId?: string
  routePath: string
  publicPath: string
}
```

`routePath` is the content route path without deployment, version, or locale prefixes, for example
`/guide/getting-started`. `publicPath` is the canonical public URL path for the built site, for
example `/v3/guide/getting-started` or `/v3/en/guide/getting-started`.

Centralize public URL building so route scanning, search, sidebars, sitemap generation, redirects,
link checking, and future locale switching do not each derive paths independently. This should be an
internal utility first, not a public API.

Acceptance criteria:

- all internal consumers can receive both `routePath` and `publicPath`
- URL generation has focused unit tests for version-only and version-plus-locale cases
- slash normalization is deterministic for root, version roots, locale roots, nested pages, and
  trailing slash inputs

### M1: Versioning Stabilization

Stabilize the existing major-version deployment contract from #78.

The non-i18n canonical shape remains `/v3/...`. `/` redirects to the current version root when root
redirects are enabled. `versions.json` remains a stable static asset that lists major versions and
their public roots.

Search, sitemap, redirects, sidebars, and link checks should consume route identity instead of
assuming route paths are already public paths. This keeps old major versions available for stable
inbound links without advertising duplicate current content.

Acceptance criteria:

- current docs can deploy under `/v3/`
- root redirect asset points to the current version root
- `versions.json` contains stable `current`, `versions[].id`, `versions[].label`, and
  `versions[].path`
- sitemap output advertises only the current canonical major version for the active build
- the version switcher preserves equivalent paths when switching between configured versions

Deferred from 4.0 unless needed by a release candidate:

- shared content across versions
- branch-based version snapshots
- automated version freezing
- cross-version diff or migration helpers
- a canonical `latest` alias

If `latest` is added later, it must redirect to the current major version path and must not become
the canonical URL advertised in sitemap or metadata.

### M2: i18n URL Preparation

Reserve the future i18n URL shape from #79 without shipping a complete i18n feature in 4.0.

When i18n is eventually enabled, canonical URLs should always include the locale:

- `/v3/en/guide/getting-started`
- `/v3/de/guide/getting-started`

The default locale is not hidden. `/v3/` may redirect to `/v3/en/` once i18n is active, but
`/v3/guide/getting-started` should not become the canonical English URL in an i18n site.

The 4.0 implementation should make this future shape easy by keeping `localeId` in route identity
and by avoiding assumptions that the first URL segment after a version is always content.

Acceptance criteria:

- route identity can represent a missing locale for current non-i18n sites
- URL builder tests cover future locale-prefixed paths
- docs state that version comes before locale
- docs state that default locale is canonicalized with a visible prefix once i18n is active

Explicitly out of scope for the 4.0 prep slice:

- translation workflows
- fallback rendering for untranslated pages
- RTL layout polish
- localized TypeDoc or OpenAPI generation
- hreflang automation
- a public language switcher

### M3: Metadata Pipeline

Create a normalized page metadata model that replaces duplicated frontmatter parsing across current
build subsystems.

Today these files derive overlapping information separately:

- `packages/ardo/src/vite/route-manifest.ts` owns route entries and anchors.
- `packages/ardo/src/vite/search-index.ts` independently scans Markdown and builds page-level search
  records.
- `packages/ardo/src/vite/sidebar-index.ts` independently parses frontmatter for sidebar data.
- `packages/ardo/src/vite/build-outputs.ts` consumes route manifest entries for sitemap, robots,
  redirects, link checking, and llms output.

The target model should normalize at least:

```ts
type PageMetadata = {
  title?: string
  description?: string
  order?: number
  sidebar?: boolean | "leaf"
  sitemap?: boolean
  redirectFrom?: string[]
  llms?: boolean
  versionId?: string
  localeId?: string
  sourcePath: string
  routePath: string
  publicPath: string
}
```

This model should remain internal until the validation and extension story is mature. It should
support existing docs without requiring a content rewrite.

Acceptance criteria:

- route manifest entries expose normalized metadata
- sidebar generation reads normalized metadata where possible
- sitemap, redirects, llms, and link checking consume normalized `publicPath` or `routePath`
  deliberately instead of mixing the two
- invalid frontmatter can produce file-specific diagnostics once validation is added

### M4: Search 2.0

Build Search 2.0 on top of route identity and normalized metadata, not as another route scanner.

The default implementation remains fully static and self-hostable. It must work on GitHub Pages,
plain static hosting, and offline static output without requiring a server, hosted provider,
database, or external indexer.

Search records should be section-level instead of page-level. Each record should include:

- stable id
- page title
- heading or section title
- heading hierarchy where available
- anchor
- excerpt
- route group or section
- `versionId`
- `localeId`
- canonical public URL

Prefer emitting static search assets such as:

```text
build/client/search/
  manifest.json
  guide.json
  api-reference.json
  components.json
```

The UI can load the manifest first and defer larger chunks until search opens or a query starts.
MiniSearch can remain the built-in local engine behind the new asset shape. Provider adapters such
as Pagefind, Algolia, or custom services stay optional and must not be required for the default
experience.

Acceptance criteria:

- search results can target headings and anchors inside a page
- snippets or excerpts are available for result display
- result records include version and locale metadata
- generated TypeDoc pages can feed the same record shape
- index size is measurable and can later connect to build budget work

### M5: Content Source Mapping

Implement #204 as a narrow source-mapping feature that feeds the metadata pipeline.

The first slice should let users publish Markdown that lives outside the route directory while
keeping the source file canonical in the repository:

```ts
ardo({
  content: [
    {
      from: "../../adr",
      to: "decisions",
    },
  ],
})
```

The implementation can materialize route files during the build, similar to the TypeDoc integration,
but the resulting pages must enter the same route identity and metadata pipeline as ordinary route
files.

Acceptance criteria:

- external Markdown can appear under a configured route prefix
- generated routes participate in sidebar, sitemap, search, llms, redirects, and link checking
- default metadata can be synthesized from first heading and filename prefixes
- the config shape remains forward-compatible with future #196 collections

Deferred:

- full typed collections
- blog/changelog/recipe collection APIs
- author/tag taxonomies
- public schema customization

### M6: Extension API Preparation

Do not publish the broad #197 extension API in 4.0 unless a concrete integration proves the surface.
Instead, use the 4.0 internals to make lifecycle phases explicit.

Candidate internal phases:

- `config:resolve` resolves user config, deployment base, versioning, i18n, and project metadata.
- `content-sources:materialize` materializes generated or mapped content before route scanning.
- `routes:generate` generates React Router route files from the routes directory.
- `metadata:scan` scans route files into normalized route identity and page metadata.
- `sidebars:generate` generates sidebar trees from normalized route metadata.
- `search:generate` generates section-level static search records and assets.
- `outputs:emit` emits sitemap, redirects, llms, versions, and search assets.
- `markdown:transform` applies Markdown, MDX, rehype, recma, and metadata transforms.

These names are internal in 4.0. They should be used as code structure and test vocabulary only,
not documented as stable extension hooks. The first future-public candidates are likely generated
content, route generation, metadata scan, sidebar generation, search generation, and output
emission. Config resolution and markdown transform hooks need more hardening before they can become
public.

TypeDoc, content source mapping, llms output, redirects, and Search 2.0 should become good internal
examples of these phases. A future public extension API can then expose the phases that have proven
stable.

Acceptance criteria:

- internal lifecycle boundaries are named and documented in code or docs
- built-in integrations do not need private one-off scanners where normalized metadata can serve
  them
- the public docs do not promise third-party extension stability in 4.0

## Public API and Interfaces

The existing versioning API remains the public versioning contract:

```ts
versioning: {
  current: "v3",
  versions: [{ id: "v3", label: "3.x", path: "/v3/" }],
  rootRedirect?: true,
}
```

The future i18n API shape is reserved as:

```ts
i18n: {
  defaultLocale: "en",
  locales: [
    { id: "en", label: "English" },
    { id: "de", label: "Deutsch" },
  ],
}
```

This document does not require implementing that public `i18n` option in 4.0. If it is introduced
early, it should be marked experimental until locale-specific sidebars, search metadata, and SEO
behavior are implemented together.

URL behavior:

- no i18n: `/v3/guide/getting-started`
- i18n active: `/v3/en/guide/getting-started`
- `/` redirects to the current version root, or current version plus default locale once i18n is
  active
- `/v3/` redirects to `/v3/en/` only when i18n is active
- `latest` must not become canonical; if added later, it redirects to the current major path

## Static Deployment and SEO

GitHub Pages support stays static-file based:

- current docs deploy to `/v3/`
- root uses a generated `index.html` redirect
- older major folders stay deployed for stable inbound links
- `versions.json` lets the runtime selector discover available major versions
- sitemap advertises only the current canonical version and, once i18n exists, only the canonical
  locale paths for the active build

Provider-level redirects through Cloudflare, Netlify, Vercel, or another CDN may be documented as an
optional enhancement, but Ardo's built-in behavior must continue to work as plain static files.

Canonical metadata should prefer stable versioned paths. Aliases such as `/latest/` should be
redirect-only and should not appear as canonical URLs.

## Test Plan

Implementation work for this milestone should include focused tests for:

- URL builder cases for version-only and version-plus-locale paths
- root and version-root redirect generation
- sitemap output containing only canonical current version and locale paths
- version switcher behavior preserving equivalent route paths
- future locale switcher behavior preserving equivalent localized route paths when present
- search records containing version and locale metadata
- section-level search records resolving to anchors
- content source mapping materializing external Markdown without bypassing metadata normalization
- link checking against normalized public paths and route paths

The plan document itself is a planning artifact. It does not require runtime tests.

## Assumptions

- This document records the 4.0 milestone direction; it does not implement runtime behavior.
- `AGENTS.md` remains untracked and untouched.
- Commit messages must follow the repository convention: conventional commits without scopes.
- A suitable commit for this document is `docs: add Ardo 4.0 milestone plan`.
