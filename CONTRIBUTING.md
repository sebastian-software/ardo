# Contributing to Ardo

Thank you for your interest in contributing to Ardo! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js >= 24.3.0 for the workspace and documentation site (Ardo supports >= 22.22.0).
- pnpm >= 9.0.0
- A supported native target: Linux/Windows x64 or arm64, or macOS Apple Silicon.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/sebastian-software/ardo.git
cd ardo

# Install dependencies
pnpm install

# Build the package
pnpm build

# Start the docs dev server
pnpm docs:dev
```

### Project Structure

```
ardo/
├── packages/
│   └── ardo/          # Main framework package (published to npm)
│   │   ├── src/
│   │   │   ├── config/      # Configuration utilities
│   │   │   ├── icons/       # Built-in icon assets and helpers
│   │   │   ├── markdown/    # Markdown processing pipeline
│   │   │   ├── mdx/         # MDX provider and auto-registered components
│   │   │   ├── runtime/     # React hooks and providers
│   │   │   ├── ui/          # React UI components and styles
│   │   │   │   └── theme/   # Theme token helpers
│   │   │   ├── api/     # native API documentation integration
│   │   │   └── vite/        # Vite plugin
│   │   └── package.json
├── docs/              # Documentation site (dogfooding)
│   ├── app/           # Ardo app and Markdown/MDX routes
│   │   └── routes/    # Documentation pages and generated API routes
│   └── public/        # Static assets and generated text outputs
├── examples/          # The public Basic setup example
├── tests/             # Integration/browser tests and focused fixture overlays
└── package.json       # Monorepo root
```

### Architecture

The architecture decision records in [`docs/adr/`](./docs/adr/) explain the major framework
decisions: static prerendering, native API documentation integration, Vanilla Extract,
context-aware UI, public API naming, the MDX component gallery and browser tests, agent instructions,
and release conventions.
Read them before changing routing, public exports, theming, build output, or release behavior.

#### Markdown pipeline

Ardo prepares each Markdown/MDX route once, parses its raw YAML frontmatter,
and renders one native module. The TOC uses that module's final headings after
title omission, heading offsets, prefixes, and native ID planning. Manifest
and search readers use the same preparation/render options and final heading
planner; sidebar and collection readers only extract preparation metadata.
Prepared documents are scoped to each invocation, so edits are reparsed during
HMR. Compiler and highlighter resources are reused by theme and line-number
configuration. Metadata reads skip highlighting; rendering still highlights
each document's fences.

#### Code block rendering

Literal `ArdoCodeBlock` samples use Ferromark's standalone fence renderer,
sharing Markdown's title/label, highlighted-line, and line-number metadata.
Generated JSX children retain native blank/trailing lines; copying uses the
original `code` prop or the outdented literal children. Explicit component
title, label, line numbers, and literal highlighted-line props take precedence
over metadata defaults. Dynamic props, interpolated templates, and custom JSX
children keep their runtime behavior.

`highlightCode` from `ardo/vite` continues to return HTML and `__html` remains
a supported `ArdoCodeBlock` input. That compatibility helper uses the direct
`@ferriki/core` dependency and the HTML metadata adapter. `MarkdownConfig.theme`
retains its Ferriki `ThemeInput` type. Ferromark bundles its own native
highlighter: updating the direct Core dependency does not update that bundled
copy. The HTML helper and native JSX renderer can produce different markup;
both preserve their respective public output contracts.

### Dependency version ranges

Use caret ranges for stable direct dependencies, including shared catalog entries.
Commit the pnpm lockfile so installations resolve the versions verified by CI.
Keep workspace links, peer compatibility ranges, and deliberate prerelease
pins such as the TypeScript nightly in their existing forms.

### Palamedes documentation integration

The docs use the published Palamedes 2.0 packages and matching native sidecars
from npm. `pnpm install --frozen-lockfile` installs the complete toolchain; no
Rust compiler or source build is required. Palamedes requires Node.js 24.3 or
newer, while the published Ardo package continues to support Node.js 22.22 or
newer. CI runs the documentation and browser checks on Node.js 24.

Keep the direct Palamedes dependencies in `docs/package.json` on the same
compatible version range and regenerate the root lockfile with pnpm. After an update, run
`pnpm --filter ardo-docs i18n:check`, `pnpm docs:budgets`, and the production and
development browser tests. The guide generator uses the internal compiled-message
renderer, so its rich-text and full-guide regression tests are required when
updating Palamedes.

### Coordinated native-engine development

Ardo uses the published Ferromark 3.4 native module and prepared-document APIs.
The registry lockfile includes matching native sidecars and supports frozen
installation. Release an upstream engine before updating Ardo's manifest and
regenerate the lockfile from the registry; final package metadata must not rely
on a local engine build. Package versions stay under their release workflows.

To verify the coordinated changes before publication, build and pack the
Ferromark and Ferriki Node facades and the matching native platform packages
from their source checkouts. In a disposable Ardo checkout, add temporary pnpm
workspace overrides pointing to those tarballs. For example, on macOS arm64:

```yaml
overrides:
  # Merge these entries into the existing overrides map.
  ferromark: file:/absolute/path/to/ferromark-3.0.0.tgz
  ferromark-darwin-arm64: file:/absolute/path/to/ferromark-darwin-arm64-3.0.0.tgz
  "@ferriki/core": file:/absolute/path/to/ferriki-core-0.10.0.tgz
  "@ferriki/darwin-arm64": file:/absolute/path/to/ferriki-darwin-arm64-0.10.0.tgz
```

These tarball names reflect the source version labels before release, rather
than an already published JSX-capable Ferromark 3.0. Install with
`pnpm install --no-frozen-lockfile`, then run the normal build, unit tests,
typechecks, and docs build. With pnpm 11, use workspace overrides;
`package.json`'s legacy `pnpm.overrides` field is ignored. While the source
manifest and temporary lockfile differ, use
`pnpm --config.verifyDepsBeforeRun=false <command>` to run an installed tool
without an automatic reinstall.

The packed-reference integration suite starts isolated Basic and optional API consumer installations.
Set `ARDO_TEST_ENGINE_OVERRIDES` to a JSON file containing the same package-name
to `file:/absolute/path/to/tarball.tgz` map, so those consumers use the tested
engine builds too. For homepage verification, also pack Ardo and add its
tarball to the homepage's temporary workspace overrides.

Ferromark's native JSX compiler owns Ferriki for Markdown fences; Ardo uses
the same native fence renderer for literal TSX codeblocks. The direct Ferriki
facade remains for the public HTML-returning `highlightCode` helper and its
`ThemeInput` configuration type; upgrading it does not change the Ferriki
version compiled into Ferromark. Both download verified
standard assets on first use and share a content-addressed cache. Persist it and
set `FERRIKI_CACHE_DIR` and `FERRIKI_ASSETS_REMOTE=0` for subsequent offline
checks. Restore the original workspace config and lockfile after local
verification; do not commit tarball paths or invented registry integrity data.

## Development Workflow

### Available Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm build`      | Build all packages                 |
| `pnpm dev`        | Start ardo package in dev mode     |
| `pnpm docs:dev`   | Start documentation dev server     |
| `pnpm docs:build` | Build the documentation site       |
| `pnpm test:e2e`   | Run docs browser interaction tests |
| `pnpm test`       | Run tests                          |
| `pnpm test:watch` | Run tests in watch mode            |
| `pnpm lint`       | Run oxlint                         |
| `pnpm format`     | Format code with Prettier          |
| `pnpm typecheck`  | Run TypeScript type checking       |

### Lint warning budgets

`pnpm lint` runs oxlint with type-aware rules over the package sources and enforces the per-rule
ceilings in `scripts/lint-warning-budget.json`. Every lint error fails the check.
A warning category without a budget also fails, and one category cannot borrow
unused budget from another. CI uses this same command.

Known warnings remain active. `pnpm lint:raw` prints every file, line, and message.
The current budgets retain JSX composition warnings (`cloneElement`, trusted
`dangerouslySetInnerHTML`, single-child fragments), mixed component and helper
exports, and conditionals in existing tests, which ESLint never checked. The JSX
composition contract is recorded in
[ADR 0008](docs/adr/0008-children-based-composition.md).

Fix errors and behavior risks before adjusting a budget. When a warning is removed,
lower its rule's ceiling in the same PR. An intentional new warning needs a reviewed
explanation of its source and impact; do not automatically regenerate or raise the
budgets to make CI pass. No lint rule is disabled by the budget checker.

### Performance Budgets

The docs site build is guarded by performance budgets (`pnpm docs:budgets`, runs in CI). The check builds the docs site and fails on material regressions in:

- **`entry.client` gzip size** — the main client entry served to every visitor
- **Eager client JS gzip size** — all JavaScript referenced from prerendered HTML; lazily loaded chunks are excluded
- **Total client JS gzip size** — everything emitted including lazy chunks, with a deliberately roomy cap
- **Search index gzip size** — the serialized `virtual:ardo/search-index` payload
- **Docs build duration** — a generous cap that only catches pathological slowdowns

Budget values and measured baselines live at the top of [`scripts/check-budgets.mjs`](./scripts/check-budgets.mjs). If your change intentionally exceeds a budget, update the budget and baseline there and explain the increase in the commit message. To re-check sizes without rebuilding, run `node scripts/check-budgets.mjs --no-build`.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

`pnpm test:integration` typechecks and builds the Basic example and applies the
focused fixtures under `tests/fixtures/`: API, multiple projects, collections,
GitHub Pages, runtime, and bare layout. Basic and its optional API configuration
also install, typecheck, and build as isolated consumers of the packed Ardo
package. CI runs these checks on Node.js 22, 24, and 26. The fixtures are
regression inputs, not setup references; `examples/basic` stays the one public
example.

### Review UI Components

Use the [Components page](https://ardo-docs.dev/v6/en/guide/components/)
to inspect component variants in the actual Ardo documentation app. Run
`pnpm docs:dev` and open Components from the guide navigation. The page uses
the default site header, search, sidebar, theme control, and mobile navigation;
its content demonstrates the public authoring components with MDX and React.

When adding or changing a component, update its gallery example and run the
focused unit tests. Interactive changes also need Playwright assertions for the
affected behavior: pointer and keyboard operation, focus, clipboard access, or
failure recovery as appropriate. Rendering a sample alone does not establish
that readers can operate it.

`pnpm test:e2e` builds the docs and runs the browser suite against the production
output. The gallery shares the normal docs build and deployment; it has no
separate preview server or artifact. See
[ADR 0021](docs/adr/0021-mdx-component-gallery-and-browser-tests.md) for the decision.

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/feature-name` — New features
- `fix/bug-description` — Bug fixes
- `docs/what-changed` — Documentation changes
- `refactor/what-changed` — Code refactoring

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This enables automatic changelog generation.

**Format:**

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Code style changes (formatting, semicolons, etc.)
- `refactor` — Code refactoring
- `perf` — Performance improvements
- `test` — Adding or updating tests
- `chore` — Maintenance tasks

**Examples:**

```
feat: add support for custom containers
fix: correct dark mode toggle behavior
docs: update getting started guide
```

### Code Style

- We use [Prettier](https://prettier.io/) for code formatting
- We use [oxlint](https://oxc.rs/docs/guide/usage/linter) for linting, configured through `eslint-config-setup`'s `getOxlintConfig()`
- TypeScript is required for all source code
- Run `pnpm format` before committing

Git hooks (via Husky) will automatically:

- Format staged files on commit
- Run type checking on push

## Pull Request Process

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the guidelines above
3. **Add tests** if applicable
4. **Update documentation** if needed
5. **Run the full test suite** with `pnpm test`
6. **Ensure type checking passes** with `pnpm typecheck`
7. **Submit a pull request** with a clear description

### PR Title

Use the same format as commit messages:

```
feat: add new feature
```

### PR Description

Include:

- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots (if UI changes)

When a feature lands, an issue is closed as not planned, or a roadmap item is
split, update the status tables on the
[Releases page](docs/app/content/guide/releases/index.mdx).

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- Ardo version
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or screenshots

### Feature Requests

When requesting features, please include:

- Clear description of the feature
- Use case / motivation
- Possible implementation approach (optional)

## Questions?

- Open a [GitHub Discussion](https://github.com/sebastian-software/ardo/discussions) for questions
- Check existing [Issues](https://github.com/sebastian-software/ardo/issues) for known problems

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

### Documentation translations

The V6 site maintains one English MDX source per guide in
`docs/app/content/guide/`. Translate its native Palamedes messages, titles,
descriptions, and static component labels in `docs/app/i18n/guides/{locale}.po`.
Shared interface copy and imported interactive examples use
`docs/app/i18n/{locale}.po`.

```bash
pnpm --filter ardo-docs i18n:extract
pnpm --filter ardo-docs i18n:check
pnpm docs:build
pnpm test:e2e
```

The docs Vite plugin generates all four language route trees before Ardo scans
routes. Development watches the source and PO catalogs. Generated guides under
`docs/app/routes/<locale>/guide/` are ignored by Git; do not edit or commit them.
Missing translations or incompatible rich placeholders fail the build. Imports,
code fences and their metadata, live React components, and English heading IDs
remain structural. Ardo derives localized metadata, the outline, search, and
Markdown/LLM exports from the generated documents. The API reference retains
English source comments in each localized shell.
