# Ardo

<div align="center">

<img src="./logo.svg" alt="Ardo Logo" width="120" height="120">

**Modern, open documentation for React teams.**

[![Powered by Sebastian Software](https://img.shields.io/badge/Powered%20by-Sebastian%20Software-00718d?style=flat-square)](https://oss.sebastian-software.com)
[![CI](https://github.com/sebastian-software/ardo/actions/workflows/ci.yml/badge.svg)](https://github.com/sebastian-software/ardo/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/ardo.svg)](https://www.npmjs.com/package/ardo)
[![npm downloads](https://img.shields.io/npm/dm/ardo.svg)](https://www.npmjs.com/package/ardo)
[![License](https://img.shields.io/npm/l/ardo.svg)](https://github.com/sebastian-software/ardo/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D22.0.0-green.svg)](https://nodejs.org/)

[Documentation](https://ardo-docs.dev/v3/) ·
[Adopt with an agent](https://ardo-docs.dev/v3/guide/adopt-ardo) ·
[Getting Started](https://ardo-docs.dev/v3/guide/getting-started) ·
[API Reference](https://ardo-docs.dev/v3/api-reference) ·
[Examples](https://github.com/sebastian-software/ardo/tree/main/examples)

</div>

---

Ardo is a static documentation framework built on React 19, React Router 8, Vite 8, MDX,
TypeScript, and Vanilla Extract. It gives React teams VitePress-style simplicity without leaving
React or moving docs into a closed platform.

The full product overview, comparison, configuration reference, deployment notes, and roadmap live
on the documentation site:

- [What is Ardo?](https://ardo-docs.dev/v3/guide/what-is-ardo)
- [Getting Started](https://ardo-docs.dev/v3/guide/getting-started)
- [Adopt Ardo in an Existing Project](https://ardo-docs.dev/v3/guide/adopt-ardo)
- [Comparison](https://ardo-docs.dev/v3/guide/comparison)
- [Configuration](https://ardo-docs.dev/v3/guide/configuration)
- [Deployment](https://ardo-docs.dev/v3/guide/deployment)
- [Feature Status](https://ardo-docs.dev/v3/guide/status-roadmap)

## Adopt an existing project

Give your coding agent `https://ardo-docs.dev/llms.txt` and the
[adoption guide](https://ardo-docs.dev/v3/guide/adopt-ardo). It will inspect the repository, select
the closest reference project, and propose the smallest change before editing files.

## Empty-directory quick start

```bash
pnpm create ardo@latest my-docs
cd my-docs
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Add an `.mdx` file to `app/routes/`, and Ardo adds it to the
generated sidebar.

Use this convenience scaffold only when its default shape fits. For an existing workspace, TypeDoc
setup, theming, and deployment, use the
[Getting Started guide](https://ardo-docs.dev/v3/guide/getting-started).

## Examples

Runnable examples live in this repository:

- [Basic docs site](./examples/basic) - minimal React Router + Ardo project.
- [Library docs](./examples/library) - TypeDoc for a single package.
- [Monorepo docs](./examples/monorepo) - TypeDoc across multiple workspace packages.
- [Content sources](./examples/content-sources) - external Markdown materialized as routes and static React data.

## Packages

| Package                                   | Description                                                  | Version                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [**ardo**](./packages/ardo)               | Core framework: Vite plugin, runtime hooks, theme components | [![npm](https://img.shields.io/npm/v/ardo.svg)](https://www.npmjs.com/package/ardo)               |
| [**create-ardo**](./packages/create-ardo) | Scaffolding CLI for new projects                             | [![npm](https://img.shields.io/npm/v/create-ardo.svg)](https://www.npmjs.com/package/create-ardo) |

The packages are released together with linked versions. Release history is kept in
[packages/ardo/CHANGELOG.md](./packages/ardo/CHANGELOG.md) and
[packages/create-ardo/CHANGELOG.md](./packages/create-ardo/CHANGELOG.md).

## Development

```bash
git clone https://github.com/sebastian-software/ardo.git
cd ardo
pnpm install
pnpm build
pnpm docs:dev
```

Useful scripts:

- `pnpm test` - run unit and integration tests.
- `pnpm typecheck` - type-check all packages.
- `pnpm docs:build` - build the documentation site.
- `pnpm storybook` - run component stories locally.

## License

[MIT](./LICENSE)

---

<!-- sebastian-software-branding:start -->
<p align="center">
  <a href="https://oss.sebastian-software.com">
    <img src="https://sebastian-brand.vercel.app/sebastian-software/logo-software.svg" alt="Sebastian Software" width="240" />
  </a>
</p>

<p align="center">
  <a href="https://oss.sebastian-software.com">Open Source at Sebastian Software</a><br />
  Copyright &copy; 2026 Sebastian Software GmbH
</p>
<!-- sebastian-software-branding:end -->
