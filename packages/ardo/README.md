# ardo

Modern, open documentation for React teams.

Ardo is a React-first static documentation framework built on React 19, React Router 8, Vite 8, MDX, TypeScript, and Vanilla Extract. It is for teams that want VitePress-style simplicity without leaving React or moving their docs into a hosted platform.

## Why use it?

- **Use real React components in docs** - import your app components, design system, providers, and examples directly in MDX.
- **Ship static docs anywhere** - Ardo prerenders HTML and assets that work on GitHub Pages, Vercel, Netlify, Cloudflare Pages, or any file server.
- **Generate API docs from TypeScript** - TypeDoc integration creates linked API reference pages during build.
- **Start with a complete theme** - responsive layout, sidebar, TOC, search, dark mode, code highlighting, callouts, tabs, Tailwind v4, and typed design tokens.
- **Keep control** - configuration is code, UI is React, output is static, and the package is open source.

## Quick start

```bash
pnpm create ardo@latest my-docs
cd my-docs
pnpm install
pnpm dev
```

## Manual installation

```bash
pnpm add ardo react react-dom react-router isbot
pnpm add -D @react-router/dev @tailwindcss/vite tailwindcss typescript vite @types/react @types/react-dom
```

## Vite configuration

```ts
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    tailwindcss(),
    ardo({
      title: "My Documentation",
      description: "Docs for my React library",
      brand: {
        color: "blue",
        accent: "teal",
        neutral: "slate",
        logo: "./app/assets/logo.svg",
      },
    }),
  ],
})
```

The `ardo()` plugin handles build-time behavior: route generation, MDX processing, TypeDoc generation, search data, and static build metadata. UI configuration stays in React through `ArdoRoot` and JSX components.

Use `brand` for the common theme setup: primary color, accent color, neutral chrome tone, and the
default header logo. Ardo also generates the modern lean favicon set (`favicon.ico`, `icon.svg`, and
`apple-touch-icon.png`) from that local SVG logo when available. Use
`icons: { source: "./app/assets/favicon.svg" }` when favicon assets should come from a different SVG,
or `icons: false` to manage them from `public/`.

## Root layout

```tsx
import {
  ArdoGeneratedSidebar,
  ArdoHeader,
  ArdoNav,
  ArdoNavLink,
  ArdoRoot,
  ArdoRootLayout,
  ArdoSidebar,
  ArdoSidebarSection,
} from "ardo/ui"
import config from "virtual:ardo/config"
import "ardo/ui/styles.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

export default function Root() {
  return (
    <ArdoRoot config={config}>
      <ArdoHeader>
        <ArdoNav>
          <ArdoNavLink to="/guide/getting-started">Guide</ArdoNavLink>
        </ArdoNav>
      </ArdoHeader>

      <ArdoSidebar>
        <ArdoSidebarSection id="guide" label="Guide" to="/guide/getting-started">
          <ArdoGeneratedSidebar section="guide" />
        </ArdoSidebarSection>
      </ArdoSidebar>
    </ArdoRoot>
  )
}
```

## Runtime hooks

```tsx
import { useArdoConfig, useArdoPageData, useArdoSidebar, useArdoTOC } from "ardo/runtime"

function PageTitle() {
  const config = useArdoConfig()
  const page = useArdoPageData()
  const sidebar = useArdoSidebar()
  const toc = useArdoTOC()

  return <h1>{page?.title ?? config.title}</h1>
}
```

## Exports

| Export               | Description                        |
| -------------------- | ---------------------------------- |
| `ardo/vite`          | Vite plugin                        |
| `ardo/runtime`       | React hooks and providers          |
| `ardo/ui`            | Default UI components              |
| `ardo/theme`         | Vanilla Extract tokens and theming |
| `ardo/ui/styles.css` | Default theme styles               |

## Documentation

Full documentation: [ardo-docs.dev](https://ardo-docs.dev)

LLM-optimized documentation: [llms-full.txt](https://ardo-docs.dev/llms-full.txt)

Changelog: [CHANGELOG.md](./CHANGELOG.md)

Examples: [basic](../../examples/basic), [library](../../examples/library), [monorepo](../../examples/monorepo)

## License

[MIT](../../LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
