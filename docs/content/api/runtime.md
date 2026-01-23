---
title: Runtime API
description: React hooks and providers for accessing React Press data.
---

# Runtime API

React Press provides React hooks to access configuration, sidebar, and page data within your components.

## PressProvider

The root provider component that makes React Press context available to child components.

```tsx
import { PressProvider } from 'react-press/runtime'

function App() {
  return (
    <PressProvider config={config} sidebar={sidebar} currentPage={pageData}>
      <YourApp />
    </PressProvider>
  )
}
```

### Props

| Prop          | Type            | Description                       |
| ------------- | --------------- | --------------------------------- |
| `config`      | `PressConfig`   | The resolved site configuration   |
| `sidebar`     | `SidebarItem[]` | The sidebar navigation items      |
| `currentPage` | `PageData`      | Optional. The current page's data |
| `children`    | `ReactNode`     | Child components                  |

## useConfig

Returns the full site configuration.

```tsx
import { useConfig } from 'react-press/runtime'

function MyComponent() {
  const config = useConfig()

  return <h1>{config.title}</h1>
}
```

### Returns

| Property      | Type          | Description         |
| ------------- | ------------- | ------------------- |
| `title`       | `string`      | Site title          |
| `description` | `string`      | Site description    |
| `base`        | `string`      | Base URL path       |
| `lang`        | `string`      | Site language       |
| `themeConfig` | `ThemeConfig` | Theme configuration |

## useThemeConfig

Returns only the theme configuration portion.

```tsx
import { useThemeConfig } from 'react-press/runtime'

function Navigation() {
  const theme = useThemeConfig()

  return (
    <nav>
      {theme.nav?.map((item) => (
        <a key={item.link} href={item.link}>
          {item.text}
        </a>
      ))}
    </nav>
  )
}
```

### Returns

| Property      | Type             | Description             |
| ------------- | ---------------- | ----------------------- |
| `logo`        | `string`         | Logo URL                |
| `siteTitle`   | `string`         | Site title override     |
| `nav`         | `NavItem[]`      | Navigation links        |
| `sidebar`     | `SidebarItem[]`  | Sidebar configuration   |
| `socialLinks` | `SocialLink[]`   | Social media links      |
| `footer`      | `FooterConfig`   | Footer configuration    |
| `search`      | `SearchConfig`   | Search configuration    |
| `editLink`    | `EditLinkConfig` | Edit link configuration |

## useSidebar

Returns the sidebar navigation items.

```tsx
import { useSidebar } from 'react-press/runtime'

function CustomSidebar() {
  const sidebar = useSidebar()

  return (
    <aside>
      {sidebar.map((group) => (
        <div key={group.text}>
          <h3>{group.text}</h3>
          <ul>
            {group.items?.map((item) => (
              <li key={item.link}>
                <a href={item.link}>{item.text}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}
```

### Returns

Array of `SidebarItem`:

| Property    | Type            | Description                       |
| ----------- | --------------- | --------------------------------- |
| `text`      | `string`        | Display text                      |
| `link`      | `string`        | Optional. URL path                |
| `items`     | `SidebarItem[]` | Optional. Nested items            |
| `collapsed` | `boolean`       | Optional. Initial collapsed state |

## usePageData

Returns the current page's data including frontmatter and table of contents.

```tsx
import { usePageData } from 'react-press/runtime'

function PageHeader() {
  const page = usePageData()

  if (!page) return null

  return (
    <header>
      <h1>{page.title}</h1>
      {page.description && <p>{page.description}</p>}
    </header>
  )
}
```

### Returns

| Property       | Type                      | Description                    |
| -------------- | ------------------------- | ------------------------------ |
| `title`        | `string`                  | Page title from frontmatter    |
| `description`  | `string`                  | Page description               |
| `frontmatter`  | `Record<string, unknown>` | All frontmatter fields         |
| `toc`          | `TOCItem[]`               | Table of contents              |
| `filePath`     | `string`                  | Source file path               |
| `relativePath` | `string`                  | Relative path from content dir |

## useTOC

Returns the table of contents for the current page.

```tsx
import { useTOC } from 'react-press/runtime'

function TableOfContents() {
  const toc = useTOC()

  if (toc.length === 0) return null

  return (
    <nav>
      <h4>On this page</h4>
      <ul>
        {toc.map((item) => (
          <li key={item.id} style={{ marginLeft: (item.level - 2) * 16 }}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

### Returns

Array of `TOCItem`:

| Property | Type     | Description                 |
| -------- | -------- | --------------------------- |
| `id`     | `string` | Heading ID for anchor links |
| `text`   | `string` | Heading text                |
| `level`  | `number` | Heading level (2-6)         |

## usePressContext

Low-level hook that returns the full context value. Use the specific hooks above for better ergonomics.

```tsx
import { usePressContext } from 'react-press/runtime'

function DebugPanel() {
  const ctx = usePressContext()

  return <pre>{JSON.stringify(ctx, null, 2)}</pre>
}
```

### Returns

| Property      | Type                    | Description             |
| ------------- | ----------------------- | ----------------------- |
| `config`      | `PressConfig`           | Full site configuration |
| `sidebar`     | `SidebarItem[]`         | Sidebar items           |
| `currentPage` | `PageData \| undefined` | Current page data       |

## Example: Custom Doc Layout

Here's a complete example combining multiple hooks:

```tsx
import { useConfig, useThemeConfig, useSidebar, usePageData, useTOC } from 'react-press/runtime'

function CustomDocLayout({ children }) {
  const config = useConfig()
  const theme = useThemeConfig()
  const sidebar = useSidebar()
  const page = usePageData()
  const toc = useTOC()

  return (
    <div className="layout">
      <header>
        <a href="/">{config.title}</a>
        <nav>
          {theme.nav?.map((item) => (
            <a key={item.link} href={item.link}>
              {item.text}
            </a>
          ))}
        </nav>
      </header>

      <div className="container">
        <aside className="sidebar">{/* Render sidebar */}</aside>

        <main>
          {page && <h1>{page.title}</h1>}
          {children}
        </main>

        <aside className="toc">{/* Render TOC */}</aside>
      </div>

      <footer>{theme.footer?.copyright}</footer>
    </div>
  )
}
```
