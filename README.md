# Ardo

<div align="center">

<img src="./logo.svg" alt="Ardo Logo" width="120" height="120">

**Documentation for React teams. No compromises.**

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

## The problem

You build your app in React. Your components are React. Your design system is React. Then you need documentation and suddenly you're stuck with a different framework, a different component model, or a different mental model entirely.

Ardo fixes that. Write your docs with the same stack you already use: React 19, React Router 7, and Vite 8. Drop your existing components straight into MDX. No wrappers, no adapters, no context switching.

## What you actually get

**Your React components in your docs.** Not through a compatibility layer. Natively. Import your design system, your interactive examples, your custom widgets. They just work.

**API docs from your TypeScript source.** TypeDoc is built in. Point it at your code and it generates complete, linked API reference pages. No plugins to configure, no separate build step to maintain.

**Type-safe routes that catch broken links at build time.** React Router 7 gives you typed route paths. A link to a page that doesn't exist? TypeScript catches it before your users do.

**Builds that don't waste your time.** Vite 8 with Rolldown. Dev server starts in under a second. Production builds finish while you're still reaching for your coffee.

## Quick start

```bash
pnpm create ardo@latest my-docs
cd my-docs
pnpm install
pnpm dev
```

Your site is running at `localhost:5173`. Add an `.mdx` file to `app/routes/` and it shows up in the sidebar.

Or add Ardo to an existing project:

```bash
pnpm add ardo react react-dom
pnpm add -D typescript vite
```

## Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
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
    }),
  ],
})
```

## Project structure

```
my-docs/
├── app/
│   ├── routes/            # MDX/MD content
│   │   ├── guide/
│   │   │   └── getting-started.mdx
│   │   └── home.tsx       # Home page
│   ├── root.tsx           # Root layout
│   ├── entry.client.tsx   # Client entry
│   └── entry.server.tsx   # Server entry
├── vite.config.ts         # Vite + Ardo configuration
├── react-router.config.ts # React Router configuration
└── package.json
```

## Deployment

Ardo builds to static HTML. Deploy it anywhere: Vercel, Netlify, GitHub Pages, Cloudflare Pages, or a plain file server. Projects created with `create-ardo` ship with a GitHub Pages workflow ready to go.

See the [Deployment Guide](https://sebastian-software.github.io/ardo/guide/deployment) for setup details.

## Packages

| Package                                   | Description                                                  | Version                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [**ardo**](./packages/ardo)               | Core framework: Vite plugin, runtime hooks, theme components | [![npm](https://img.shields.io/npm/v/ardo.svg)](https://www.npmjs.com/package/ardo)               |
| [**create-ardo**](./packages/create-ardo) | Scaffolding CLI for new projects                             | [![npm](https://img.shields.io/npm/v/create-ardo.svg)](https://www.npmjs.com/package/create-ardo) |

## Development

```bash
git clone https://github.com/sebastian-software/ardo.git
cd ardo
pnpm install
pnpm build
pnpm docs:dev
```

## License

[MIT](./LICENSE) &copy; [Sebastian Software GmbH](https://sebastian-software.de)
