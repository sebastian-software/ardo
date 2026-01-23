---
title: Config Reference
description: Complete API reference for Ardo configuration.
---

# Config Reference

This page documents all configuration options available in Ardo.

## defineConfig

The `defineConfig` helper provides type hints for your configuration:

```ts
import { defineConfig } from 'ardo/config'

export default defineConfig({
  // your config
})
```

## Site Config

### title

- Type: `string`
- Required: Yes

The title of your site. Displayed in the browser tab and header.

```ts
export default defineConfig({
  title: 'My Documentation',
})
```

### description

- Type: `string`
- Default: `''`

The description of your site. Used for SEO.

```ts
export default defineConfig({
  description: 'Documentation for my awesome project',
})
```

### base

- Type: `string`
- Default: `'/'`

The base URL path when deploying to a subdirectory.

```ts
export default defineConfig({
  base: '/docs/',
})
```

### srcDir

- Type: `string`
- Default: `'content'`

The directory containing your markdown files.

```ts
export default defineConfig({
  srcDir: 'docs',
})
```

### outDir

- Type: `string`
- Default: `'dist'`

The output directory for production builds.

```ts
export default defineConfig({
  outDir: 'build',
})
```

### lang

- Type: `string`
- Default: `'en'`

The language of your site.

```ts
export default defineConfig({
  lang: 'de',
})
```

### head

- Type: `HeadConfig[]`

Additional tags to inject into the `<head>`.

```ts
export default defineConfig({
  head: [
    { tag: 'meta', attrs: { name: 'theme-color', content: '#3b82f6' } },
    { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico' } },
  ],
})
```

## Theme Config

See [Theme Configuration](/guide/theme-config) for detailed documentation.

```ts
export default defineConfig({
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'My Docs',
    nav: [...],
    sidebar: [...],
    socialLinks: [...],
    footer: {...},
    search: {...},
    editLink: {...},
    lastUpdated: {...},
    outline: {...},
  },
})
```

## Markdown Config

### theme

- Type: `BundledTheme | { light: BundledTheme; dark: BundledTheme }`
- Default: `{ light: 'github-light', dark: 'github-dark' }`

The Shiki theme for syntax highlighting.

```ts
export default defineConfig({
  markdown: {
    theme: 'nord',
    // or
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
})
```

### lineNumbers

- Type: `boolean`
- Default: `false`

Show line numbers in code blocks by default.

```ts
export default defineConfig({
  markdown: {
    lineNumbers: true,
  },
})
```

### toc

Configure table of contents extraction.

```ts
export default defineConfig({
  markdown: {
    toc: {
      level: [2, 3], // Extract h2 and h3
    },
  },
})
```

### remarkPlugins

- Type: `Plugin[]`

Additional remark plugins.

```ts
import remarkMath from 'remark-math'

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
  },
})
```

### rehypePlugins

- Type: `Plugin[]`

Additional rehype plugins.

```ts
import rehypeKatex from 'rehype-katex'

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeKatex],
  },
})
```

## TypeScript Types

```ts
import type { PressConfig, ThemeConfig, MarkdownConfig, SidebarItem, NavItem } from 'ardo'
```
