# ADR 0023: Localize the V6 docs through Palamedes PO catalogs

## Status

Accepted.

## Decision

Publish English, German, French, and Spanish under `/v6/<locale>/`. Maintain
one English MDX source per guide in `app/content/guide/` and translations in
`app/i18n/guides/{locale}.po`. Shared UI and interactive examples use the
separate `app/i18n/{locale}.po` catalogs.

Palamedes' native compiler owns message extraction, rich placeholders, and
message identity. Its native catalog compiler validates and compiles the PO
translations. A docs-only build adapter consumes the generated JSX with OXC
and applies those compiled messages through Palamedes' runtime. It produces
ignored MDX language routes before Ardo collects page data. Authored JavaScript
is preserved without being evaluated by the generator. This keeps metadata,
the outline, search, and Markdown/LLM exports in the same localized document
as the rendered page.

Ferromark supplies structural metadata: source heading IDs, code blocks and
fence metadata, task states, and alert variants. Imports and JSX components
remain intact. Static MDX attributes are translated; object-valued interactive
component props use macros in imported TSX components. Development watches the
English source and PO files. Invalid or incomplete catalogs fail before any
changed route is written.

## Palamedes before v2 publication

Install the pinned source revision through a pnpm Git URL. The root lockfile
owns the source archive and build tools. Build the required JavaScript and
native packages in the ignored `docs/.cache/palamedes` directory, respecting
Ardo's docs-package boundary. There is no Git submodule or nested package
installation. Rust 1.96 or newer remains a temporary build prerequisite.

The published 1.x parser rejected fenced imports; the pinned main revision
uses Ferromark 3.6.0. Full guide conversion exposed whitespace loss around inline-code placeholders,
misclassified indented link labels, and dropped empty table cells. A pnpm patch
fixes those native behaviors, changes the extraction cache stamp, and includes
regression tests.
Remove the patch when an upstream revision contains the fix. Move to coordinated
published v2 packages after verifying the same checks.

The imported MDX example continues to use Palamedes' full Vite compiler and
browser catalog-delivery pipeline. The server scopes each complete render to
one locale and inserts its import map through `createViteCatalogDelivery`.
Guide translations are resolved at build time, so guide catalogs do not ship
to the browser.

## Retained behavior

- Language switches preserve the page, query, and source heading ID.
- Search, metadata, alternate links, and Markdown/LLM exports use the route language.
- TypeScript API comments remain English inside explicitly marked localized shells.
- Former V6 URLs redirect to English; V3–V5 retain their original URLs and language.
- Palamedes remains a docs dependency; other Ardo sites choose their translation tool.
- Edit links point to the maintained English guide source; dates reflect source/catalog Git history.

## References

- [Internationalization guide](../app/content/guide/internationalization.mdx)
- [Catalog configuration](../palamedes.yaml)
- [Build adapter](../scripts/localize-guides.mjs)
- [Browser coverage](../../tests/e2e/i18n.spec.ts)
