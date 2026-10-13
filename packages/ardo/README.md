# ardo

Modern, open documentation for React teams.

Ardo is a React-first static documentation framework built on React 19, React Router 8, Vite 8, MDX, TypeScript, and Vanilla Extract. It is for teams that want VitePress-style simplicity without leaving React or moving their docs into a hosted platform.

## Why use it?

- **Use real React components in docs** - import your app components, design system, providers, and examples directly in MDX.
- **Ship static docs anywhere** - Ardo prerenders HTML and assets that work on GitHub Pages, Vercel, Netlify, Cloudflare Pages, or any file server.
- **Generate API docs from TypeScript** - Native TypeScript and OXC create linked API reference pages during builds and development.
- **Start with a complete theme** - responsive layout, sidebar, TOC, search, dark mode, code highlighting, callouts, tabs, and typed design tokens. Tailwind v4 is optional.
- **Keep control** - configuration is code, UI is React, output is static, and the package is open source.

## Quick start

Give your coding agent the repository and this instruction:

```text
Set up Ardo 6 in this repository. Read https://ardo-docs.dev/v6/llms.txt,
then follow https://ardo-docs.dev/v6/guide/agent-instructions. Adapt the
closest tested reference from the matching Ardo release tag, preserve
existing application behavior, and run the applicable checks and build.
```

The versioned instructions cover new sites, adoption, and upgrades. Use the
reference from the installed package's `ardo-v<version>` tag; for development,
use the instructions and built package from the same checkout revision.
Ardo 6 retires `create-ardo`.

## Manual installation

```bash
pnpm add ardo@6 react@19 react-dom@19 react-router@8 isbot@5
pnpm add -D @react-router/dev@8 @tailwindcss/vite@4 tailwindcss@4 typescript@6 vite@8 @types/react@19 @types/react-dom@19
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

The `ardo()` plugin handles build-time behavior: route generation, MDX processing, native API generation, search data, and static build metadata. UI configuration stays in React through `ArdoRoot` and JSX components.

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

| Export               | Description                                       |
| -------------------- | ------------------------------------------------- |
| `ardo/api`           | Native API projects and declaration documentation |
| `ardo/vite`          | Vite plugin                                       |
| `ardo/runtime`       | React hooks and providers                         |
| `ardo/ui`            | Default UI components                             |
| `ardo/theme`         | Vanilla Extract tokens and theming                |
| `ardo/ui/styles.css` | Default theme styles                              |

## Documentation

Full documentation: [Ardo 6](https://ardo-docs.dev/v6/)

Agent instructions: [Agent Instructions](https://ardo-docs.dev/v6/guide/agent-instructions)

LLM-optimized documentation: [llms-full.txt](https://ardo-docs.dev/v6/llms-full.txt)

Changelog: [CHANGELOG.md](./CHANGELOG.md)

Examples: [basic](../../examples/basic), [library](../../examples/library), [monorepo](../../examples/monorepo)

## License

[MIT](../../LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de)
