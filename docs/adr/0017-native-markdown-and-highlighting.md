# 0017: Use Ferromark and Ferriki for authored documentation

## Status

Accepted, 2026-10-01.

Updated: 2026-11-09

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

Ardo injects Ferriki into Ferromark's native `CodeCompiler` through
Ferromark's code hooks. Before each render, Ardo loads the theme and the
grammars of the document's fence languages; Ferriki highlights lines and
Ferromark keeps titles, line annotations, and the generic codeblock component.
Unknown languages stay plain code and report a warning. The component receives
highlighted JSX children and original code for copying. Literal `ArdoCodeBlock`
usages in TSX use the same hooks through a cached compiler. Ferriki is a direct
dependency for these hooks, the public HTML-returning `highlightCode`
compatibility helper, and the configuration `ThemeInput` type. The public
`__html` component input remains supported. Existing title, label,
highlighted-line, line-number, and component override behavior remains part of
the content contract.

With the opt-in `markdown.mermaid` option, Ferrigura renders `mermaid` fences to
static SVG through the same hook mechanism. `@ferrigura/core` is an optional
peer dependency, loaded only when the option is on, so sites without diagrams
do not install it. Diagram colors are `light-dark()` values. Ardo declares
`color-scheme` on the root element for the theme it shows, so diagrams, form
controls, and scrollbars follow the theme toggle. Invalid diagrams stay code and
report a warning with file and line. Markdown and LLM exports keep the original
fence as readable text.

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
The new Ferromark JSX API must ship before Ardo's dependent release; the
code hooks require Ferromark 4. Local
verification uses packaged source builds of the coordinated changes; it does
not imply publication or cross-platform binary validation.

Acceptance covers the Ardo documentation and examples plus the Ferromark and
Ferriki documentation homepages. Engine conformance and package checks remain
their respective repository gates. Simpler architecture and package dogfooding
are the success criteria; no performance claim follows from the migration.
