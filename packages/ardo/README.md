# ardo

React-first Static Documentation Framework built on React Router 7.

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
pnpm add ardo react react-dom react-router
pnpm add -D typescript vite
```

## Usage

### Vite Configuration

Create a `vite.config.ts` with your Ardo configuration:

```typescript
import { defineConfig } from "vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    ardo({
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
    }),
  ],
})
```

The `ardo()` plugin includes React Router, MDX processing, and all necessary configuration.

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
import { Layout, Header, Sidebar, Footer } from "ardo/ui"

function App() {
  return (
    <Layout header={<Header />} sidebar={<Sidebar />} footer={<Footer />}>
      <YourContent />
    </Layout>
  )
}
```

## Exports

| Export               | Description               |
| -------------------- | ------------------------- |
| `ardo/vite`          | Vite plugin (`ardo`)      |
| `ardo/runtime`       | React hooks and providers |
| `ardo/ui`            | Pre-built UI components   |
| `ardo/ui/styles.css` | Default theme styles      |

## Documentation

Full documentation available at [sebastian-software.github.io/ardo](https://sebastian-software.github.io/ardo/)

LLM-optimized documentation: [llms-full.txt](https://sebastian-software.github.io/ardo/llms-full.txt)

## License

[MIT](../../LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
