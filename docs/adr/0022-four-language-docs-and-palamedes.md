# ADR 0022: Publish four static language trees with Palamedes interface catalogs

## Status

Accepted, 2026-10-24.

## Context

Ardo has static locale routing but its own documentation did not exercise it.
V6 should demonstrate a complete localized site, including navigation, search,
metadata, interactive examples, and compatibility with older documentation.
Palamedes now supports MDX and supplies compiled catalogs and server scopes.

Ardo and Palamedes both compile entire MDX modules. Passing a route through both
compilers would leave heading IDs, highlighting, component bindings, and search
metadata without a single owner. A global mutable language is also unsafe when
the static renderer processes several pages concurrently.

## Decision

Publish English, German, French, and Spanish under `/v6/<locale>/`. Author matching
Markdown and MDX route trees with identical slugs and stable heading IDs. Ardo
owns compilation of these routes. Keep the build-time completeness check; a
missing translation must not silently serve another language.

Use Palamedes macros and PO catalogs for the shared home page, interface labels,
and metadata. Load one compiled catalog before client hydration. On the server,
`app/server.ts` wraps the complete render in a Palamedes AsyncLocalStorage scope,
including metadata resolution and suspended components. Cache immutable locale
instances rather than changing the active locale of a process-wide instance.

Demonstrate native Palamedes MDX with one explicitly imported `?palamedes` module.
A small docs-owned Vite adapter gives that module to Palamedes, while Ardo retains
ownership of route MDX. The example includes rich text, an imported callout, and
an interactive plural counter verified before and after hydration.

Generate and lazily load search data per locale. Translate UI labels through
Ardo's public label contract, format dates with the route locale, and emit
canonical and alternate-language links. Keep the active article, query, and
fragment when switching languages.

Generate API routes for every locale so navigation remains complete. Retain the
English TypeScript source comments, identifiers, signatures, and code examples,
and disclose their language in the localized shell. Mark the reference body as
English for assistive technology.

Redirect former V6 URLs to English. Preserve query strings and fragments on
same-origin static redirects. Older V3–V5 snapshots remain unlocalized; version
metadata explicitly declares that capability so the switcher removes the locale.

## Consequences

- The docs exercise the public i18n APIs through the same static deployment path
  as other Ardo sites. No translation service or runtime content server is needed.
- Authored guides require coordinated updates in four trees. Catalog extraction
  checks shared copy; it does not translate or synchronize authored documents.
- Four sets of static content increase total deployment size. Budgets distinguish
  the largest language's eager JavaScript and search chunk from aggregate output.
- Palamedes is a docs dependency, not an Ardo runtime dependency. Other sites can
  choose their translation system through labels and the server render hook.
- API prose and historical snapshots remain English by design. Translating source
  API comments would require a separate, maintained content-generation workflow.

## References

- [Internationalization guide](../app/routes/en/guide/internationalization.mdx)
- [Catalog configuration](../palamedes.yaml)
- [Browser coverage](../../tests/e2e/i18n.spec.ts)
