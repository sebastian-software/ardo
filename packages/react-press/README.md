# react-press

React-first Static Documentation Framework built on TanStack Start.

## Installation

```bash
pnpm add react-press @tanstack/react-start @tanstack/react-router react react-dom
pnpm add -D typescript vite tailwindcss
```

## Usage

### Configuration

Create a `press.config.ts` in your project root:

```typescript
import { defineConfig } from 'react-press/config'

export default defineConfig({
  title: 'My Documentation',
  description: 'Built with React Press',

  themeConfig: {
    nav: [{ text: 'Guide', link: '/guide/getting-started' }],
    sidebar: [
      {
        text: 'Guide',
        items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
      },
    ],
  },
})
```

### Vite Plugin

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { reactPressPlugin } from 'react-press/vite'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    react(),
    reactPressPlugin(),
  ],
})
```

### Runtime Hooks

Access configuration and page data in your components:

```tsx
import { useConfig, useSidebar, usePageData, useTOC } from 'react-press/runtime'

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
import { DocPage, Layout, Header, Sidebar, TOC } from 'react-press/theme'

function App() {
  return (
    <DocPage>
      <YourContent />
    </DocPage>
  )
}
```

## Exports

| Export                         | Description                              |
| ------------------------------ | ---------------------------------------- |
| `react-press/config`           | Configuration utilities (`defineConfig`) |
| `react-press/vite`             | Vite plugin (`reactPressPlugin`)         |
| `react-press/runtime`          | React hooks and providers                |
| `react-press/theme`            | Pre-built UI components                  |
| `react-press/theme/styles.css` | Default theme styles                     |

## Documentation

Full documentation available at [sebastian-software.github.io/react-press](https://sebastian-software.github.io/react-press/)

## License

[MIT](../../LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
