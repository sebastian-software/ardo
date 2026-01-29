---
title: Getting Started
description: Get up and running with Ardo in minutes.
---

# Getting Started

This guide will help you set up a new Ardo documentation site from scratch.

## Prerequisites

Before you begin, make sure you have:

- [Node.js](https://nodejs.org/) version 22 or higher
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn

## Quick Start

The fastest way to get started is with the `create-ardo` CLI:

```bash
pnpm create ardo@latest my-docs
cd my-docs
pnpm install
pnpm dev
```

This scaffolds a complete project with configuration, example content, and a GitHub Pages deployment workflow.

## Manual Installation

If you prefer to set up manually:

### 1. Create a new project

```bash
mkdir my-docs
cd my-docs
pnpm init
```

### 2. Install dependencies

```bash
pnpm add ardo @tanstack/react-router @tanstack/react-start react react-dom
pnpm add -D typescript vite @types/react @types/react-dom
```

### 3. Create Vite configuration

Create a `vite.config.ts` file with your Ardo configuration:

```ts
import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
      title: "My Documentation",
      description: "My awesome documentation site",

      themeConfig: {
        nav: [{ text: "Guide", link: "/guide/getting-started" }],
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

### 4. Create route files

Create the TanStack Router boilerplate files:

**`src/routes/__root.tsx`**:

```tsx
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import config from "virtual:ardo/config"
import "ardo/theme/styles.css"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: config.title },
      { name: "description", content: config.description },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

**`src/routes/index.tsx`**:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { HomePage } from "ardo/theme"
import { PressProvider } from "ardo/runtime"
import config from "virtual:ardo/config"
import sidebar from "virtual:ardo/sidebar"
import { frontmatter, toc } from "../../content/index.md"

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

function HomeComponent() {
  const pageData = {
    title: (frontmatter.title as string) || "Home",
    frontmatter,
    toc,
    filePath: "index.md",
    relativePath: "index.md",
  }

  return (
    <PressProvider config={config} sidebar={sidebar} currentPage={pageData}>
      <HomePage />
    </PressProvider>
  )
}
```

**`src/routes/(docs)/_layout.tsx`**:

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { DocLayout } from "ardo/theme"
import { PressProvider } from "ardo/runtime"
import config from "virtual:ardo/config"
import sidebar from "virtual:ardo/sidebar"

export const Route = createFileRoute("/(docs)/_layout")({
  component: DocsLayoutComponent,
})

function DocsLayoutComponent() {
  return (
    <PressProvider config={config} sidebar={sidebar}>
      <DocLayout>
        <Outlet />
      </DocLayout>
    </PressProvider>
  )
}
```

**`src/router.tsx`**:

```tsx
import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })
}
```

**`src/vite-env.d.ts`**:

```ts
/// <reference types="vite/client" />

declare module "virtual:ardo/config" {
  import type { PressConfig } from "ardo"
  const config: PressConfig
  export default config
}

declare module "virtual:ardo/sidebar" {
  import type { SidebarItem } from "ardo"
  const sidebar: SidebarItem[]
  export default sidebar
}

declare module "*.md" {
  import type { ComponentType } from "react"
  import type { PageFrontmatter, TOCItem } from "ardo"
  export const frontmatter: PageFrontmatter
  export const toc: TOCItem[]
  const component: ComponentType
  export default component
}
```

### 5. Create your first document

Create a `content` directory and add an `index.md` file:

```markdown
---
title: Welcome
hero:
  name: My Docs
  text: Documentation Made Simple
  tagline: Focus on your content, not configuration
  actions:
    - text: Get Started
      link: /guide/getting-started
      theme: brand
---
```

And a guide page at `content/guide/getting-started.md`:

```markdown
---
title: Getting Started
---

# Getting Started

Welcome to your documentation site!
```

:::tip
Using `pnpm create ardo@latest` creates all these files automatically!
:::

## Development

Start the development server:

```bash
pnpm dev
```

Your documentation site will be available at `http://localhost:3000`.

Ardo automatically generates route files for your markdown content in `src/routes/(docs)/`. These files are derived from your `content/` directory and should be added to `.gitignore`.

## Production Build

Build your site for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Project Structure

A typical Ardo project looks like this:

```
my-docs/
├── content/                     # Your markdown files
│   ├── index.md                 # Home page
│   └── guide/
│       └── getting-started.md
├── src/
│   ├── routes/
│   │   ├── __root.tsx           # HTML shell
│   │   ├── index.tsx            # Home page route
│   │   └── (docs)/
│   │       ├── _layout.tsx      # Documentation layout
│   │       └── *.tsx            # Auto-generated from content/
│   ├── router.tsx               # Router configuration
│   ├── routeTree.gen.ts         # Auto-generated route tree
│   └── vite-env.d.ts            # TypeScript declarations
├── vite.config.ts               # Vite + Ardo configuration
├── tsconfig.json
└── package.json
```

Files in `src/routes/(docs)/` (except `_layout.tsx`) are auto-generated from your markdown content and should be gitignored.

## Next Steps

Now that you have a working documentation site:

- Learn about [Markdown Features](/guide/markdown)
- Configure your [Theme](/guide/theme-config)
- [Deploy your site](/guide/deployment) to GitHub Pages, Netlify, or Vercel
- Explore the [API Reference](/api-reference)
