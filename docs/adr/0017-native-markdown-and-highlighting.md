# 0017: Use Ferromark and Ferriki for authored documentation

## Status

Accepted, 2026-10-01.

## Context

Ardo's Markdown and MDX paths use separate unified pipelines, and highlighting
uses Shiki. Ferromark and Ferriki already provide the native syntax engines
maintained alongside Ardo. Adopting them makes engine ownership explicit and
lets the projects exercise their own packages in their documentation sites.

## Decision

The next Ardo major compiles both `.md` and `.mdx` with Ferromark. Ferromark
produces framework-neutral JSX, authored ESM, source mappings, code metadata,
front matter, and an authoritative heading outline. Ardo owns React provider
bindings, layout selection, page context, and route metadata. Vite's Oxc JSX
transform compiles the resulting module while retaining its original file ID.

Ferromark's reusable native `JsxCompiler` owns Ferriki and highlights Markdown
fences as part of JSX rendering. It loads and caches theme and grammar assets
on first use. Ardo configures the theme, line numbers, and generic codeblock
component; the component receives highlighted JSX children and original code
for copying. Literal `ArdoCodeBlock` usages in TSX use the same native fence renderer
through a cached compiler. The direct Ferriki dependency remains for the public
HTML-returning `highlightCode` compatibility helper and the configuration
`ThemeInput` type. The public `__html` component input remains supported. Existing title, label, highlighted-line, line-number, and component
override behavior remains part of the content contract.

Configuration exposes the supported ordered native Ferromark passes. The
remark, rehype, and recma plugin APIs are removed. The public standalone HTML
transform and document-loader APIs are removed; standalone HTML consumers can
use Ferromark directly. Existing authored content retains its behavior except
for the explicitly accepted native heading slug rules. Rendered headings,
table of contents, search, and link validation use the same native IDs.

Node 22.13 or newer and native Linux/Windows x64 or arm64 or macOS Apple Silicon
are required. First-use asset downloads are supported; repeatable offline CI
uses a populated Ferriki cache and disabled remote downloads.

## Consequences

This is a breaking configuration/API change and requires an Ardo major release.
The new Ferromark JSX API must ship before Ardo's dependent release. Local
verification uses packaged source builds of the coordinated changes; it does
not imply publication or cross-platform binary validation.

Acceptance covers the Ardo documentation and examples plus the Ferromark and
Ferriki documentation homepages. Engine conformance and package checks remain
their respective repository gates. Simpler architecture and package dogfooding
are the success criteria; no performance claim follows from the migration.
