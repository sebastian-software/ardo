---
title: Getting Started
description: Get up and running with Ardo in minutes.
---

# Getting Started

This guide will help you set up a new Ardo documentation site from scratch.

## Prerequisites

Before you begin, make sure you have:

- [Node.js](https://nodejs.org/) version 18 or higher
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn

## Installation

### 1. Create a new project

```bash
mkdir my-docs
cd my-docs
pnpm init
```

### 2. Install dependencies

```bash
pnpm add ardo @tanstack/react-start @tanstack/react-router react react-dom
pnpm add -D typescript vite tailwindcss
```

### 3. Create configuration

Create a `press.config.ts` file in your project root:

```ts
import { defineConfig } from 'ardo/config'

export default defineConfig({
  title: 'My Documentation',
  description: 'My awesome documentation site',

  themeConfig: {
    nav: [{ text: 'Guide', link: '/guide/introduction' }],
    sidebar: [
      {
        text: 'Guide',
        items: [{ text: 'Introduction', link: '/guide/introduction' }],
      },
    ],
  },
})
```

### 4. Create your first document

Create a `content` directory and add an `index.md` file:

```markdown
---
title: Welcome
---

# Welcome to My Documentation

This is my documentation site built with Ardo.
```

### 5. Set up Vite

Create a `vite.config.ts` file:

```ts
import { defineConfig } from 'vite'
import { ardoPlugin } from 'ardo/vite'

export default defineConfig({
  plugins: [ardoPlugin()],
})
```

## Development

Start the development server:

```bash
pnpm dev
```

Your documentation site will be available at `http://localhost:3000`.

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
├── content/           # Your markdown files
│   ├── index.md       # Home page
│   └── guide/
│       └── intro.md
├── press.config.ts    # Ardo config
├── vite.config.ts     # Vite config
└── package.json
```

## Next Steps

Now that you have a working documentation site:

- Learn about [Markdown Features](/guide/markdown)
- Configure your [Theme](/guide/theme-config)
- Explore the [API Reference](/api/config)
