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
│   └── ardo/          # Main package (published to npm)
│       ├── src/
│       │   ├── config/      # Configuration utilities
│       │   ├── markdown/    # Markdown processing pipeline
│       │   ├── runtime/     # React hooks and providers
│       │   ├── theme/       # UI components
│       │   ├── typedoc/     # TypeDoc integration
│       │   └── vite/        # Vite plugin
│       └── package.json
├── docs/              # Documentation site (dogfooding)
│   ├── content/       # Markdown content
│   └── src/           # Documentation app
└── package.json       # Monorepo root
```

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
<type>(<scope>): <description>

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
feat(markdown): add support for custom containers
fix(theme): correct dark mode toggle behavior
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
feat(scope): add new feature
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
