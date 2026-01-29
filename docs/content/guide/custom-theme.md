---
title: Custom Theme
description: Learn how to customize or create your own theme.
---

# Custom Theme

Ardo allows you to fully customize the look and feel of your documentation site.

## CSS Variables

The easiest way to customize the theme is by overriding CSS variables.

Create a custom CSS file:

```css
/* styles/custom.css */
:root {
  --press-c-brand: #8b5cf6;
  --press-c-brand-light: #a78bfa;
  --press-c-brand-dark: #7c3aed;
}
```

Import it in your app:

```ts
import "./styles/custom.css"
import "ardo/theme/styles.css"
```

### Available Variables

```css
:root {
  /* Brand colors */
  --press-c-brand: #3b82f6;
  --press-c-brand-light: #60a5fa;
  --press-c-brand-dark: #2563eb;

  /* Background colors */
  --press-c-bg: #ffffff;
  --press-c-bg-soft: #f8fafc;
  --press-c-bg-mute: #f1f5f9;

  /* Text colors */
  --press-c-text: #1e293b;
  --press-c-text-light: #475569;
  --press-c-text-lighter: #64748b;

  /* Layout */
  --press-sidebar-width: 280px;
  --press-toc-width: 240px;
  --press-content-max-width: 800px;
  --press-header-height: 64px;

  /* Typography */
  --press-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ...;
  --press-font-mono: ui-monospace, SFMono-Regular, ...;

  /* Border radius */
  --press-radius: 8px;
  --press-radius-sm: 4px;
}
```

## Component Overrides

You can override individual theme components by creating your own:

```tsx
// components/MyHeader.tsx
import { useConfig, useThemeConfig } from "ardo/runtime"

export function MyHeader() {
  const config = useConfig()
  const themeConfig = useThemeConfig()

  return (
    <header className="my-custom-header">
      <h1>{config.title}</h1>
      {/* Your custom header content */}
    </header>
  )
}
```

Then use it in your layout:

```tsx
// routes/__root.tsx
import { MyHeader } from "../components/MyHeader"
import { Sidebar, Footer } from "ardo/theme"

export function Layout({ children }) {
  return (
    <div>
      <MyHeader />
      <Sidebar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
```

## Runtime Hooks

Ardo provides several hooks for accessing configuration and page data:

### useConfig

```tsx
import { useConfig } from "ardo/runtime"

function MyComponent() {
  const config = useConfig()
  return <h1>{config.title}</h1>
}
```

### useThemeConfig

```tsx
import { useThemeConfig } from "ardo/runtime"

function MyNav() {
  const themeConfig = useThemeConfig()
  return (
    <nav>
      {themeConfig.nav?.map((item) => (
        <a href={item.link}>{item.text}</a>
      ))}
    </nav>
  )
}
```

### useSidebar

```tsx
import { useSidebar } from "ardo/runtime"

function MySidebar() {
  const sidebar = useSidebar()
  // Render sidebar items
}
```

### usePageData

```tsx
import { usePageData } from "ardo/runtime"

function MyContent() {
  const pageData = usePageData()
  return (
    <article>
      <h1>{pageData?.title}</h1>
      {/* content */}
    </article>
  )
}
```

### useTOC

```tsx
import { useTOC } from "ardo/runtime"

function MyTOC() {
  const toc = useTOC()
  return (
    <nav>
      {toc.map((item) => (
        <a href={`#${item.id}`}>{item.text}</a>
      ))}
    </nav>
  )
}
```

## Full Custom Theme

For complete control, create your own theme from scratch:

```tsx
// theme/index.tsx
export { MyLayout as Layout } from "./Layout"
export { MyHeader as Header } from "./Header"
export { MySidebar as Sidebar } from "./Sidebar"
export { MyTOC as TOC } from "./TOC"
export { MyContent as Content } from "./Content"
export { MyFooter as Footer } from "./Footer"
```

Then use your custom theme components throughout your app.
