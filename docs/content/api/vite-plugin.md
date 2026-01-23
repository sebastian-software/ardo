---
title: Vite Plugin
description: Configure the Ardo Vite plugin for your project.
---

# Vite Plugin

The Ardo Vite plugin handles markdown transformation, configuration loading, and virtual modules.

## Installation

```bash
pnpm add ardo vite
```

## Basic Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { ardoPlugin } from 'ardo/vite'

export default defineConfig({
  plugins: [ardoPlugin()],
})
```

## Options

### config

Pass configuration directly instead of loading from file.

```ts
import { ardoPlugin } from 'ardo/vite'

ardoPlugin({
  config: {
    title: 'My Docs',
    description: 'Documentation for my project',
    themeConfig: {
      // ...
    },
  },
})
```

### configPath

Specify a custom path to the configuration file.

```ts
ardoPlugin({
  configPath: './config/docs.config.ts',
})
```

Default: `press.config.ts` in project root.

## Virtual Modules

The plugin provides virtual modules for accessing configuration at runtime.

### virtual:ardo/config

Access the resolved configuration in your code:

```ts
import config from 'virtual:ardo/config'

console.log(config.title) // Site title
console.log(config.themeConfig) // Theme configuration
```

**TypeScript Support:**

Create a `env.d.ts` or add to your existing declarations:

```ts
declare module 'virtual:ardo/config' {
  import type { PressConfig } from 'ardo'
  const config: PressConfig
  export default config
}
```

### virtual:ardo/sidebar

Access the resolved sidebar structure:

```ts
import sidebar from 'virtual:ardo/sidebar'

console.log(sidebar) // Array of SidebarItem
```

**TypeScript Support:**

```ts
declare module 'virtual:ardo/sidebar' {
  import type { SidebarItem } from 'ardo'
  const sidebar: SidebarItem[]
  export default sidebar
}
```

## Markdown Transformation

The plugin transforms `.md` files into React components.

### Input

```markdown
---
title: My Page
description: Page description
---

# Hello World

Content here with **bold** and `code`.
```

### Output

The transformed module exports:

```ts
// Frontmatter as an object
export const frontmatter: {
  title: string
  description: string
  // ... other frontmatter fields
}

// Table of contents extracted from headings
export const toc: Array<{
  id: string
  text: string
  level: number
}>

// React component that renders the content
export default function MarkdownContent(): JSX.Element
```

### Usage in Routes

```tsx
// src/routes/docs/$.tsx
const contentModules = import.meta.glob('../content/**/*.md', { eager: true })

function DocPage() {
  const module = contentModules['../content/guide/intro.md']
  const Content = module.default
  const { frontmatter, toc } = module

  return (
    <article>
      <h1>{frontmatter.title}</h1>
      <Content />
    </article>
  )
}
```

## Features

### Syntax Highlighting

Code blocks are automatically highlighted using [Shiki](https://shiki.matsu.io/):

````markdown
```typescript
const greeting: string = 'Hello, World!'
console.log(greeting)
```
````

Configure themes in `press.config.ts`:

```ts
export default defineConfig({
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
})
```

### Frontmatter

YAML frontmatter is parsed and made available:

```markdown
---
title: Page Title
description: SEO description
author: John Doe
date: 2024-01-01
tags:
  - tutorial
  - react
---
```

### Table of Contents Generation

Headings are automatically extracted for TOC:

```markdown
# Title → level: 1

## Section → level: 2

### Subsection → level: 3
```

Configure which levels to include:

```ts
export default defineConfig({
  markdown: {
    toc: {
      level: [2, 3], // Only h2 and h3
    },
  },
})
```

### Auto-Generated Sidebar

If no sidebar is configured, the plugin scans your content directory and generates one automatically:

```
content/
├── index.md
├── guide/
│   ├── getting-started.md  → "Getting Started"
│   ├── configuration.md    → "Configuration"
│   └── advanced/
│       └── plugins.md      → "Plugins"
└── api/
    └── reference.md        → "Reference"
```

Control ordering with frontmatter:

```yaml
---
title: Getting Started
order: 1
---
```

## With TanStack Start

Full setup with TanStack Start:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { ardoPlugin } from 'ardo/vite'

export default defineConfig({
  plugins: [tanstackStart(), react(), ardoPlugin()],
})
```

## Troubleshooting

### CSS not loading in dev mode

Add to your Vite config:

```ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['ardo/theme/styles.css'],
  },
  ssr: {
    noExternal: ['ardo'],
  },
})
```

### Virtual module type errors

Add type declarations as shown in the [Virtual Modules](#virtual-modules) section.

### Markdown not updating

Clear Vite's cache:

```bash
rm -rf node_modules/.vite
pnpm dev
```
