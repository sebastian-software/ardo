# Contributing to Ardo

Thank you for your interest in contributing to Ardo! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 9.0.0

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
│   ├── ardo/          # Main framework package (published to npm)
│   │   ├── src/
│   │   │   ├── config/      # Configuration utilities
│   │   │   ├── icons/       # Built-in icon assets and helpers
│   │   │   ├── markdown/    # Markdown processing pipeline
│   │   │   ├── mdx/         # MDX provider and auto-registered components
│   │   │   ├── runtime/     # React hooks and providers
│   │   │   ├── ui/          # React UI components and styles
│   │   │   │   └── theme/   # Theme token helpers
│   │   │   ├── typedoc/     # TypeDoc integration
│   │   │   └── vite/        # Vite plugin
│   │   └── package.json
│   └── create-ardo/   # Scaffolding CLI and project template
│       ├── src/       # CLI, prompts, upgrade, and scaffold logic
│       └── templates/ # Generated project files
├── docs/              # Documentation site (dogfooding)
│   ├── app/           # React Router app and markdown routes
│   │   └── routes/    # Documentation pages and generated API routes
│   └── public/        # Static assets and generated text outputs
├── examples/          # Runnable example projects used by tests/docs
└── package.json       # Monorepo root
```

### Architecture

The architecture decision records in [`docs/adr/`](./docs/adr/) explain the major framework
decisions: React Router migration, static prerendering, TypeDoc integration, Vanilla Extract,
context-aware UI, public API naming, Storybook, Tailwind in the scaffold, and release conventions.
Read them before changing routing, public exports, theming, build output, or release behavior.

## Development Workflow

### Available Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `pnpm build`      | Build all packages             |
| `pnpm dev`        | Start ardo package in dev mode |
| `pnpm docs:dev`   | Start documentation dev server |
| `pnpm test`       | Run tests                      |
| `pnpm test:watch` | Run tests in watch mode        |
| `pnpm lint`       | Run ESLint                     |
| `pnpm format`     | Format code with Prettier      |
| `pnpm typecheck`  | Run TypeScript type checking   |

### Performance Budgets

The docs site build is guarded by performance budgets (`pnpm docs:budgets`, runs in CI). The check builds the docs site and fails on material regressions in:

- **`entry.client` gzip size** — the main client entry served to every visitor
- **Eager client JS gzip size** — all JavaScript referenced from prerendered HTML; lazily loaded chunks (such as Mermaid) are excluded
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
- We use [ESLint](https://eslint.org/) for linting
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
