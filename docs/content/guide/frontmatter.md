---
title: Frontmatter
description: Configure page-specific options using frontmatter.
---

# Frontmatter

Frontmatter is YAML metadata at the top of your markdown files that controls page-specific settings.

## Basic Usage

```yaml
---
title: My Page Title
description: A description for SEO
---
# Page Content

Your content here...
```

## Available Options

### title

- Type: `string`

The title of the page. Used in the browser tab and as the `<h1>` if not provided in content.

```yaml
---
title: Getting Started
---
```

### description

- Type: `string`

The description of the page. Used for SEO meta tags.

```yaml
---
description: Learn how to get started with Ardo
---
```

### layout

- Type: `'doc' | 'home' | 'page'`
- Default: `'doc'`

The layout to use for the page.

- `doc` - Documentation layout with sidebar and TOC
- `home` - Home page layout with hero and features
- `page` - Simple page without sidebar

```yaml
---
layout: home
---
```

### sidebar

- Type: `boolean`
- Default: `true`

Whether to show the sidebar on this page.

```yaml
---
sidebar: false
---
```

### outline

- Type: `boolean | number | [number, number]`
- Default: `true`

Configure the table of contents.

```yaml
---
outline: [2, 3] # Show h2 and h3 headings
---
```

### editLink

- Type: `boolean`
- Default: `true`

Whether to show the "Edit this page" link.

```yaml
---
editLink: false
---
```

### lastUpdated

- Type: `boolean`
- Default: `true`

Whether to show the last updated time.

```yaml
---
lastUpdated: false
---
```

### prev / next

- Type: `string | { text: string; link: string } | false`

Override the previous/next page links.

```yaml
---
prev: /guide/introduction
next:
  text: Advanced Topics
  link: /guide/advanced
---
```

## Home Page Options

### hero

Configure the hero section on home pages:

```yaml
---
layout: home
hero:
  name: Ardo
  text: React-first Documentation
  tagline: Build beautiful documentation sites
  image: /logo.png
  actions:
    - text: Get Started
      link: /guide/getting-started
      theme: brand
    - text: GitHub
      link: https://github.com
      theme: alt
---
```

### features

Add feature cards to home pages:

```yaml
---
layout: home
features:
  - title: Fast
    icon: '⚡'
    details: Lightning fast builds with Vite
    link: /guide/performance
    linkText: Learn more
  - title: Simple
    icon: '✨'
    details: Easy to set up and use
---
```
