# React Press

<div align="center">

**React-first Static Documentation Framework**

[![CI](https://github.com/sebastian-software/react-press/actions/workflows/ci.yml/badge.svg)](https://github.com/sebastian-software/react-press/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/react-press.svg)](https://github.com/sebastian-software/react-press/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/react-press.svg)](https://www.npmjs.com/package/react-press)

[Documentation](https://sebastian-software.github.io/react-press/) ·
[Getting Started](https://sebastian-software.github.io/react-press/guide/getting-started) ·
[API Reference](https://sebastian-software.github.io/react-press/api/config)

</div>

---

## What is React Press?

React Press is a modern documentation framework built on React 19 and TanStack Start. It combines the developer experience of VitePress with the power of the React ecosystem.

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
# Create a new project
mkdir my-docs && cd my-docs
pnpm init

# Install dependencies
pnpm add react-press @tanstack/react-start @tanstack/react-router react react-dom
pnpm add -D typescript vite tailwindcss

# Create your first doc
mkdir -p content
echo "# Hello World" > content/index.md

# Start developing
pnpm dev
```

## Package

| Package                                   | Description                                                          | Version                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [**react-press**](./packages/react-press) | Core framework with Vite plugin, runtime hooks, and theme components | [![npm](https://img.shields.io/npm/v/react-press.svg)](https://www.npmjs.com/package/react-press) |

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
import { defineConfig } from 'react-press/config'

export default defineConfig({
  title: 'My Documentation',
  description: 'Built with React Press',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/reference' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
      },
    ],
  },
})
```

## Comparison

|                      |   React Press   |   VitePress   |  Docusaurus  |   Starlight   |
| -------------------- | :-------------: | :-----------: | :----------: | :-----------: |
| **UI Framework**     |    React 19     |     Vue 3     |   React 18   |     Astro     |
| **Build Tool**       | Vite + Rolldown | Vite + Rollup |   Webpack    | Vite + Rollup |
| **Router**           | TanStack Router |  Vue Router   | React Router | Astro Router  |
| **Type-safe Routes** |       ✅        |      ❌       |      ❌      |      ❌       |

See the [full comparison](https://sebastian-software.github.io/react-press/guide/comparison) in our documentation.

## Development

```bash
# Clone the repository
git clone https://github.com/sebastian-software/react-press.git
cd react-press

# Install dependencies
pnpm install

# Build the package
pnpm build

# Start the docs dev server
pnpm docs:dev
```

## License

[MIT](./LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
