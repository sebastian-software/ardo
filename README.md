# Ardo

<div align="center">

<img src="./logo.svg" alt="Ardo Logo" width="120" height="120">

**React-first Static Documentation Framework**

[![CI](https://github.com/sebastian-software/ardo/actions/workflows/ci.yml/badge.svg)](https://github.com/sebastian-software/ardo/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/ardo.svg)](https://www.npmjs.com/package/ardo)
[![npm downloads](https://img.shields.io/npm/dm/ardo.svg)](https://www.npmjs.com/package/ardo)
[![License](https://img.shields.io/npm/l/ardo.svg)](https://github.com/sebastian-software/ardo/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D22-green.svg)](https://nodejs.org/)

[Documentation](https://sebastian-software.github.io/ardo/) ·
[Getting Started](https://sebastian-software.github.io/ardo/guide/getting-started) ·
[API Reference](https://sebastian-software.github.io/ardo/api/config)

</div>

---

## What is Ardo?

Ardo is a modern documentation framework built on React 19 and TanStack Start. It combines the developer experience of VitePress with the power of the React ecosystem.

**Key Features:**

- **React 19** — Latest React features including Server Components
- **TanStack Router** — Type-safe routing with full TypeScript support
- **Vite 8 + Rolldown** — Lightning-fast builds with next-gen bundling
- **Static Prerendering** — SEO-friendly static HTML generation
- **Markdown + MDX** — Write content in Markdown with React components
- **Shiki Syntax Highlighting** — Beautiful code blocks with build-time highlighting
- **Dark Mode** — Built-in theme toggle with CSS custom properties
- **Full-Text Search** — Client-side search powered by MiniSearch

## Quick Start

```bash
# Create a new project with the CLI
pnpm create ardo@latest my-docs

# Navigate to project
cd my-docs

# Install dependencies
pnpm install

# Start developing
pnpm dev
```

Or manually:

```bash
pnpm add ardo react react-dom
pnpm add -D typescript vite
```

## Packages

| Package                                   | Description                                                          | Version                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [**ardo**](./packages/ardo)               | Core framework with Vite plugin, runtime hooks, and theme components | [![npm](https://img.shields.io/npm/v/ardo.svg)](https://www.npmjs.com/package/ardo)               |
| [**create-ardo**](./packages/create-ardo) | Scaffolding CLI for new Ardo projects                                | [![npm](https://img.shields.io/npm/v/create-ardo.svg)](https://www.npmjs.com/package/create-ardo) |

## Deployment

Ardo builds to fully static HTML — deploy anywhere. Projects scaffolded with `create-ardo` include a GitHub Pages workflow out of the box. See the [Deployment Guide](https://sebastian-software.github.io/ardo/guide/deployment) for details on GitHub Pages, Netlify, and Vercel.

## Documentation Structure

```
my-docs/
├── content/           # Markdown content
│   ├── index.md       # Homepage
│   ├── guide/
│   │   └── getting-started.md
│   └── api/
│       └── reference.md
├── press.config.ts    # Site configuration
├── vite.config.ts     # Vite configuration
└── package.json
```

## Configuration

```typescript
// press.config.ts
import { defineConfig } from "ardo/config"

export default defineConfig({
  title: "My Documentation",
  description: "Built with Ardo",

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/reference" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [{ text: "Getting Started", link: "/guide/getting-started" }],
      },
    ],
  },
})
```

## Comparison

|                      |      Ardo       |   VitePress   |  Docusaurus  |   Starlight   |
| -------------------- | :-------------: | :-----------: | :----------: | :-----------: |
| **UI Framework**     |    React 19     |     Vue 3     |   React 18   |     Astro     |
| **Build Tool**       | Vite + Rolldown | Vite + Rollup |   Webpack    | Vite + Rollup |
| **Router**           | TanStack Router |  Vue Router   | React Router | Astro Router  |
| **Type-safe Routes** |       ✅        |      ❌       |      ❌      |      ❌       |

See the [full comparison](https://sebastian-software.github.io/ardo/guide/comparison) in our documentation.

## Development

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

## Used By

<!-- Add your project here! Submit a PR to be featured. -->

_Your project could be here! [Submit a PR](https://github.com/sebastian-software/ardo/edit/main/README.md) to add your documentation site._

## License

[MIT](./LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
