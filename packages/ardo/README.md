# ardo

React docs, baked into plain HTML.

Ardo is a static site generator for React projects. Guides in Markdown and MDX, an API reference read from your TypeScript, and search, all prerendered at build time by Rust engines. It is for teams that want VitePress-style simplicity without leaving React or moving their docs into a hosted platform.

## Why use it?

- **Use real React components in docs** - use local components, providers, and examples in MDX, or install a packaged design system in the docs project.
- **Ship static docs anywhere** - Ardo prerenders HTML and assets that work on GitHub Pages, Vercel, Netlify, Cloudflare Pages, or any file server.
- **Generate API docs from TypeScript** - Native TypeScript and OXC create linked API reference pages during builds and development.
- **Start with a complete theme** - responsive layout, sidebar, TOC, search, dark mode, code highlighting, callouts, tabs, and typed design tokens. Tailwind v4 is optional.
- **Keep control** - configuration is code, UI is React, output is static, and the package is open source.

## Quick start

Hand this sentence to your coding agent, in a fresh repository or one you already have:

```text
Set up Ardo in this repository following https://ardo-docs.dev/llms.txt.
```

The link points it to the versioned [Agent Instructions](https://ardo-docs.dev/v6/guide/agent-instructions). It adapts the tested Basic example and reports how typecheck, tests, and build went. The same instructions cover new sites, adoption, and upgrades.

## Manual installation

```bash
pnpm add ardo@6
pnpm add -D typescript@6
```

Any TypeScript 6 or newer typechecks an Ardo site. The optional API documentation needs the
pinned TypeScript 7.1 nightly named in its guide.

Keep the docs project in its own package or directory. Declare its component libraries locally and import their public exports; sibling application source is outside the docs package boundary.

Use `ardo dev`, `ardo build`, and `ardo preview` in your package scripts. Ardo
manages the React, React DOM, and Vite dependencies. Follow the
[Basic example](https://ardo-docs.dev/v6/guide/agent-instructions#the-basic-example) for app files, TypeScript configuration,
and the minimal pnpm esbuild build-script policy.

## Ardo configuration

Put optional site settings in `ardo.config.ts`:

```ts
import { defineArdoConfig } from "ardo/config"

export default defineArdoConfig({
  title: "My Documentation",
  description: "Docs for my React library",
})
```

The Ardo CLI supplies build integration. Keep `vite.config.ts` only for additional
Vite plugins or settings. UI configuration stays in React through `ArdoRoot`
and JSX components.

Theme the site in `app/root.tsx`: `<ArdoRoot theme={{ color: "blue", neutral: "slate" }} />` sets
the brand, accent, and neutral hues, saturation, callout colors, fonts, and any design token. The
logo and favicon are imported files, `<ArdoRoot logo={logo} icon={icon} />`, so Vite fingerprints
them. Without an icon, Ardo generates its owl favicon set (`favicon.ico`, `icon.svg`, and
`apple-touch-icon.png`).

## Root layout

`app/root.tsx` exports the root component. `<ArdoRoot />` is a complete site: header with
search, a sidebar with one section per route folder, and the footer. Ardo supplies the site
config and its stylesheet.

```tsx
import { ArdoRoot } from "ardo/ui"

export default function Root() {
  return <ArdoRoot />
}
```

Pass the chrome as children to change it:

```tsx
import {
  ArdoGeneratedSidebar,
  ArdoHeader,
  ArdoNav,
  ArdoNavLink,
  ArdoRoot,
  ArdoSidebar,
  ArdoSidebarSection,
} from "ardo/ui"

export default function Root() {
  return (
    <ArdoRoot>
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

Example: [Basic](https://ardo-docs.dev/v6/guide/agent-instructions#the-basic-example). Optional [API](https://ardo-docs.dev/v6/guide/api-documentation), [content](https://ardo-docs.dev/v6/guide/content-sources), and [deployment](https://ardo-docs.dev/v6/guide/deployment) recipes extend the same setup.

## License

[MIT](https://github.com/sebastian-software/ardo/blob/main/LICENSE) © [Sebastian Software GmbH](https://sebastian-software.de). The sidebar section icons are from [Streamline](https://streamlinehq.com) and come under [their own terms](./ICONS-LICENSE.md).
