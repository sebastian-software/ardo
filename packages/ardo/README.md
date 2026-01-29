# ardo

React-first Static Documentation Framework built on TanStack Start.

## Quick Start

Scaffold a new project with the CLI:

```bash
pnpm create ardo@latest my-docs
cd my-docs
pnpm install
pnpm dev
```

## Manual Installation

```bash
pnpm add ardo @tanstack/react-start @tanstack/react-router react react-dom
pnpm add -D typescript vite tailwindcss
```

## Usage

### Configuration

Create a `press.config.ts` in your project root:

```typescript
import { defineConfig } from "ardo/config"

export default defineConfig({
  title: "My Documentation",
  description: "Built with Ardo",

  themeConfig: {
    nav: [{ text: "Guide", link: "/guide/getting-started" }],
    sidebar: [
      {
        text: "Guide",
        items: [{ text: "Getting Started", link: "/guide/getting-started" }],
      },
    ],
  },
})
```

### Vite Plugin

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { ardoPlugin } from "ardo/vite"

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    react(),
    ardoPlugin(),
  ],
})
```

### Runtime Hooks

Access configuration and page data in your components:

```tsx
import { useConfig, useSidebar, usePageData, useTOC } from "ardo/runtime"

function MyComponent() {
  const config = useConfig()
  const sidebar = useSidebar()
  const page = usePageData()
  const toc = useTOC()

  return <h1>{config.title}</h1>
}
```

### Theme Components

Use pre-built components for your documentation:

```tsx
import { DocPage, Layout, Header, Sidebar, TOC } from "ardo/theme"

function App() {
  return (
    <DocPage>
      <YourContent />
    </DocPage>
  )
}
```

## Exports

| Export                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `ardo/config`           | Configuration utilities (`defineConfig`) |
| `ardo/vite`             | Vite plugin (`ardoPlugin`)               |
| `ardo/runtime`          | React hooks and providers                |
| `ardo/theme`            | Pre-built UI components                  |
| `ardo/theme/styles.css` | Default theme styles                     |

## Documentation

Full documentation available at [sebastian-software.github.io/ardo](https://sebastian-software.github.io/ardo/)

LLM-optimized documentation: [llms-full.txt](https://sebastian-software.github.io/ardo/llms-full.txt)

## License

[MIT](../../LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
