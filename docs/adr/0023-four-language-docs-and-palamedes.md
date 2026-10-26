# ADR 0023: Localize the V6 docs through Palamedes PO catalogs

## Status

Proposed; implementation in progress. The V2 source integration is verified.
Consolidating the authored guide translations into one MDX source remains open.

## Context and direction

Publish English, German, French, and Spanish under `/v6/<locale>/`, with localized
navigation, search, metadata, and interactive examples. Keep one English MDX
source for each authored guide and maintain translations in Palamedes PO catalogs.
Four separately maintained guide trees are an interim implementation, not the
accepted authoring model.

Ardo and Palamedes both use Ferromark. The published Palamedes 1.x compiler used
an older parser that rejected imports inside code fences in our guides. Current
Palamedes `main` uses Ferromark 3.6.0 and successfully analyzes all authored guides.
Separate complete compilers do not justify duplicating the authored content.
The remaining integration must preserve Ardo's headings, highlighting, metadata,
search, and LLM exports while applying the catalog translations.

## V2 source integration

Until coordinated V2 packages are published, use the pinned Git submodule at
`docs/vendor/palamedes`. Build the JavaScript packages, native compiler, and CLI
from that revision with Palamedes' own lockfile and Rust toolchain. Keep the
source inside the docs package to respect Ardo's existing import boundary.

Shared UI and the imported MDX example use the full Palamedes compiler pipeline,
including its generated catalog fragments. The server render hook scopes the
complete render to one locale and uses the official `createViteCatalogDelivery`
transport to insert that locale's import map before module execution. Generated
browser dependencies initialize the runtime; application code does not load
browser catalogs manually. Catalog failures get the adapter's independent
Reload/Home view. Browser tests cover hydration, active-locale delivery, failure,
and recovery.

## Retained behavior

- Preserve the active page, query, and fragment when switching languages.
- Emit localized search, dates, canonical URLs, and alternate-language links.
- Keep English TypeScript API comments inside explicitly marked localized shells.
- Redirect former V6 URLs to English and retain the unlocalized V3–V5 snapshots.
- Keep Palamedes as a docs dependency; Ardo sites choose their own translation tool.

The PR remains a draft until guide consolidation and its metadata/search/LLM
verification are complete. The source integration removes the parser blocker;
it does not establish that the pending guide pipeline is implemented.

## References

- [Internationalization guide](../app/routes/en/guide/internationalization.mdx)
- [Catalog configuration](../palamedes.yaml)
- [Browser coverage](../../tests/e2e/i18n.spec.ts)
