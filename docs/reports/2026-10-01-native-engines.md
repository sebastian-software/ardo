# Native engine migration: local verification

Verified on 2026-10-01 on macOS arm64, with development builds on Node 24.21.0
and runtime unit/coverage tests on exact Node 22.13.0. This records source/package verification
before the coordinated releases; it does not certify a registry installation
or the other native platform binaries.

## Implementation

Ferromark emits framework-neutral JSX, ESM source spans, component references,
native heading IDs, code descriptors, and source mappings. Ardo supplies the
React module, provider bindings, layouts, and page context, then uses Vite's
Oxc transform under the original Markdown/MDX file ID. Ferromark's reusable
native `JsxCompiler` owns Ferriki, asset loading, and highlighting for Markdown
fences. Ardo calls the direct Ferriki facade only for literal TSX code blocks.
The default code-block component renders native JSX children with one copy
button, preserving the original code, title, label, and line metadata.

TOC, search, and link validation use the same native heading outline. YAML is
the supported frontmatter format; TOML blocks, including empty ones, are
rejected.
Legacy Remark/Rehype/recma customization and standalone document-loader and
HTML-transform APIs are removed. The docs configuration now builds under
`/v5/` and retains older versions in the version selector.

See [ADR 0017](../adr/0017-native-markdown-and-highlighting.md),
[the upgrade guide](../app/routes/guide/upgrade-to-v5.mdx), and
[local package verification instructions](../../CONTRIBUTING.md#coordinated-native-engine-development).

## Results

| Gate                                                  | Result                                                                                                                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ardo unit tests                                       | 241 tests in 58 files pass on exact Node 22.13.0, including the real default provider's single-copy-button SSR regression and the CI UI regressions       |
| Ardo coverage                                         | Pass: statements 59.3%, branches 56.08%, functions 66.17%, lines 59.48%; the existing thresholds are unchanged                                            |
| Ardo lint and formatting                              | Pass: full lint has 0 errors and 287 non-failing warnings; full formatting passes                                                                         |
| Ardo browser smoke tests                              | Both Chromium tests pass against the built `/v5/` docs: hydration, search, theme changes, and mobile navigation                                           |
| Ardo Storybook                                        | Production and interaction builds pass; all 33 browser interaction tests in 23 suites pass                                                                |
| Ardo integration                                      | 32 tests in 6 suites pass: examples and a fresh packed scaffold consumer                                                                                  |
| Ardo declared workspace typechecks and package builds | Pass                                                                                                                                                      |
| Ardo production docs                                  | TypeDoc generates 47 API pages; 70 routes prerender under `/v5/`                                                                                          |
| Docs search and fragments                             | All 432 search targets and 477 rendered internal fragment links resolve                                                                                   |
| Docs budgets                                          | Pass: entry 55.7 KiB, eager JS 351.7 KiB, total JS 1270.9 KiB, search 56.2 KiB gzip; build duration 93.2 seconds                                          |
| Ferromark Rust                                        | Workspace all-feature tests, strict Clippy, formatting, and bench compilation pass                                                                        |
| Ferromark legacy MDX                                  | Existing ESM/JSX/expression tests also pass without default features                                                                                      |
| Ferromark Node                                        | All 144 tests pass, including exact Node 22.13.0; lint, types, formatting, and pack checks pass; 78 tests pass in a clean packed consumer                 |
| Ferromark Rust archives                               | Core and transforms packages, isolated consumer, and unpacked targets pass; unpacked core targets also compile with `jsx,ferriki-remote` enabled          |
| Ferriki compatibility                                 | Required core compatibility lane and dedicated contracts pass; its existing deferred upstream fixture list remains in effect                              |
| Ferromark homepage                                    | Final local Ardo pack builds 28 routes; all 6 benchmark tests pass; 116 local fragments and one absolute same-host fragment resolve with no duplicate IDs |
| Ferriki homepage                                      | Final local Ardo pack builds 10 routes; sample contracts pass; all 48 fragments resolve with no duplicate IDs                                             |

Changed files pass lint and formatting; generated READMEs pass their mdtheme
checks. These checks exercise functionality and packaging, not comparative
performance. Ferriki's asset cache was populated and remote downloads disabled
during engine integration builds. The native Rust adapter uses Ferriki 0.7's
public API; the direct Node facade uses 0.8.2. Their standard asset manifests
match byte-for-byte for all 325 payloads, and the local cache matches every
manifest hash. The adapter does not consume private Ferriki APIs.

Independent review of the generated homepage caught a nested legacy `pre`
wrapper. Removing it leaves one native code block and one copy button. The
final TSX fixture has the title and label, seven numbered lines including blank
and final lines, highlights exactly on lines 3–5, and 50 dual-theme tokens.

## Existing findings

The seven previously recorded UI lint errors and the CLI formatting finding
are fixed. The disclosure state closes on pathname changes without remounting
header children; search autofocus uses a callback ref; icon rendering keeps
the registered component identity; tab values are assigned before child render.
Regression tests cover navigation/back/reopen, autofocus, and implicit tab
associations under StrictMode, parent rerenders, clicks, and nested groups.
Custom components that create tabs internally use explicit matching values
and a default value, as documented in the component contract.

The Storybook runner emits five non-failing accessibility notices for existing
stories (MobileSlidePanel, ErrorBoundary, Layout, Steps, and Footer).

TypeDoc's unchanged generator creates component navigation under `other/`
instead of `components/` and props links under `interfaces/` even for grouped
type aliases. These remain build warnings, alongside existing Storybook and
example-image links. Ardo's unchanged owl logo also repeats the SVG symbol ID
`ardo-owl-eye` when rendered more than once; no other duplicate IDs were found
in the docs output.

Audits report no vulnerabilities in the Ferromark Node workspace or Ferriki
homepage. The Ferromark homepage has 1 low and 8 moderate advisories, matching
its baseline, with none at high severity. Ferriki's existing homepage Oxlint
warning remains non-failing.

## Release boundary

The source labels remain Ferromark 3.0.0 and Ardo/create-ardo 4.2.0 for their
release workflows. Local tarballs contain the coordinated changes under those
labels; they do not represent already published JSX-capable releases.

1. Release the Ferromark JSX API as 3.1, including matching native sidecars.
2. Regenerate Ardo's registry lockfile for `ferromark ^3.1.0` and Ferriki 0.8.2,
   repeat the normal frozen-install gates, and release the linked Ardo packages
   as 5.0.
3. Regenerate both engine homepage lockfiles for `ardo ^5.0.0` and verify their
   frozen installations before deployment.

Temporary tarball overrides and their lockfile changes have been removed.
The original registry lockfiles are deliberately retained until real releases
exist, so they currently differ from the new manifest ranges and are not ready
for frozen installation. No registry integrity values were fabricated, and no
packages or sites were published by this verification.

## Upstream usability issues

- [Ferromark #499: reusable native document for metadata and JSX rendering](https://github.com/sebastian-software/ferromark/issues/499)
  records the repeated parsing needed for metadata, authored module scope, and
  final JSX rendering. The native compiler already owns asset discovery.
- [Ferriki #182: constructor transformers silently ignored](https://github.com/sebastian-software/ferriki/issues/182)
  contains a reproduced async/sync example; Ardo's literal TSX prepass passes its
  transformer on each highlighting call.
- [Ferriki #183: public multi-theme Rust highlighting](https://github.com/sebastian-software/ferriki/issues/183)
  records the public API improvement that would remove Ferromark's two
  highlighting calls and UTF-8 token-boundary reconciliation for dual themes.
