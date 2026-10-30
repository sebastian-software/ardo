# ADR 0025: Separate site pages from versioned documentation

## Status

Accepted. Directory-based scope is opt-in through `versioning.directories`;
omitting it preserves the legacy whole-site versioning contract.

## Context

Ardo currently applies the active documentation version's base path to every
route. That includes designed homepages and other routes using `layout: bare`.
Suppressing the deployment-root redirect does not relocate those routes to the
site root. Internal links, development serving, output assets, and version
controls also assume one global version scope.

A news post needs a stable address across documentation releases. Marketing
pages and the site homepage have the same requirement. API references and
detailed guides need to retain the selected documentation version. Applying
one global version prefix to all of them mixes those different lifecycles.

## Decision

Distinguish site pages from documentation pages in route identity. Site pages,
including posts, marketing pages, current comparisons, and benchmark overview
pages, have URLs independent of documentation versions. Versioning has a narrow
purpose: readers deliberately using an older product release can consult the
corresponding API reference and detailed documentation. Versioning remains
optional for a project. Both scopes respect the site's deployment base.

An unversioned benchmark page can identify the tested product versions and
measurement date. That evidence belongs to the page's content and does not
require versioning the entire benchmark area.

Keep visual layout independent of version scope. A designed documentation
landing page may be versioned, and a site page need not be identified by its
layout. Select complete directories in the route tree for documentation
versioning; everything outside those directories remains in site scope.

The publication feature described by [ADR 0024](./0024-repository-authored-posts-and-portable-metadata.md)
uses site scope. Its URLs and feeds do not move when the active documentation
version changes.

## Directory-Based Scope

Configure the directories that contain versioned documentation, such as
`guide` and the API reference output directory. Their entire route subtrees
participate in documentation versioning. All other directories and the site
homepage remain unversioned. The directory boundary applies equally to
Markdown, MDX, TSX, and generated API pages.

A page belongs to the scope of its directory. There are no page-level version
flags, exclusion lists, or exceptions inside a selected subtree. Authors move
content into or out of a versioned directory to change its scope. Visual layout
and file format do not affect the rule.

FerroMark's existing `/guide` mixes technical documentation with comparison
and benchmark pages. During adoption, move permanent comparisons and benchmarks
to unversioned areas rather than introducing exceptions to preserve that mixed
organization. Existing inbound URLs need a deliberate redirect migration.

Missing directory selection preserves existing URLs. An explicit selection
enables the new contract; adopting it requires an intentional URL migration.

## Considered Alternative

Central route-prefix inclusion and exclusion could retain mixed directories
without moving pages. That makes the effective scope depend on rules elsewhere
in the configuration and lets adjacent pages unexpectedly follow different
version policies. Prefer a visible directory boundary and the one-time content
reorganization over maintaining those exceptions.

## Consequences

- This is a general route identity change rather than a special case for
  `/news`. It affects canonical URLs, internal links, development serving,
  prerendering, assets, locale navigation, and version controls.
- Site home and documentation home need distinct identities. The current
  root-redirect behavior cannot also own a real site homepage at that address.
- Version controls must operate on documentation routes without manufacturing
  versioned copies of site URLs.
- Existing documentation-only sites need an explicit compatibility policy.
  Existing retained snapshots may still contain historical marketing pages;
  this decision does not silently rewrite those snapshots.

## Compatibility and Navigation

With directory selection, the deployment base owns shared assets and the site
home. Each route carries its own public identity, and internal links resolve
the target's scope. Public URL collisions fail the build. Version controls and
historical-version banners appear only on documentation routes.

The logo links to the current site home, retaining the current locale. A
documentation version root redirects into the first configured documentation
area, preferring shallower routes, explicit order, and then route path. It does
not duplicate the site homepage. `rootRedirect: true` is invalid with directory
selection because the root belongs to the site.

Strict localization applies to both scopes. Site URLs use the deployment base
plus locale, while documentation URLs also include the version before the
locale. The deployment root redirects to the default site locale.

Existing archived builds are not rewritten automatically. Adopters move mixed
content into the appropriate directories and explicitly redirect former
versioned site URLs. Omitting `directories` keeps existing behavior, including
the legacy root redirect, asset placement, and versioned homepage.

## References

- [Static site architecture](./0020-static-site-without-react-router.md)
- [Route identity](../../packages/ardo/src/vite/route-identity.ts)
- [Versioned configuration](../../packages/ardo/src/config/versioning.ts)
- [Static output](../../packages/ardo/src/vite/static-site.ts)
- [Runtime link paths](../../packages/ardo/src/runtime/page-context.ts)
- [Version controls](../../packages/ardo/src/ui/site-controls-state.ts)
