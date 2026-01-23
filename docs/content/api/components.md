---
title: Theme Components
description: Ready-to-use React components for building documentation sites.
---

# Theme Components

Ardo includes a complete set of React components for building documentation sites. All components are fully styled and support dark mode.

## Layout Components

### Layout

The main layout wrapper that provides the page structure.

```tsx
import { Layout } from 'ardo/theme'

function App() {
  return (
    <Layout>
      <YourContent />
    </Layout>
  )
}
```

### Header

The top navigation bar with logo, nav links, search, and theme toggle.

```tsx
import { Header } from 'ardo/theme'

<Header />
```

Automatically reads configuration from `useThemeConfig()` for:

- Logo and site title
- Navigation links
- Social links
- Search button

### Sidebar

The left sidebar navigation component.

```tsx
import { Sidebar } from 'ardo/theme'

<Sidebar />
```

Features:

- Collapsible sections
- Active link highlighting
- Auto-generated from sidebar config
- Responsive (hidden on mobile)

### TOC

Table of contents component for the right sidebar.

```tsx
import { TOC } from 'ardo/theme'

<TOC />
```

Features:

- Auto-generated from page headings
- Active section highlighting on scroll
- Configurable heading levels

### Content

Wrapper for the main content area with proper styling.

```tsx
import { Content } from 'ardo/theme'

<Content>
  <MarkdownContent />
</Content>
```

### Footer

Page footer with customizable message and copyright.

```tsx
import { Footer } from 'ardo/theme'

<Footer />
```

## Page Layouts

### DocPage

Complete documentation page layout combining all components.

```tsx
import { DocPage } from 'ardo/theme'

function DocsRoute() {
  return (
    <DocPage>
      <MarkdownContent />
    </DocPage>
  )
}
```

Includes:

- Header
- Sidebar
- Content area
- Table of contents
- Previous/Next navigation
- Footer

### DocLayout

Alias for `DocPage` for consistency with other frameworks.

```tsx
import { DocLayout } from 'ardo/theme'

<DocLayout>{children}</DocLayout>
```

### HomePage

Home page layout with hero section and features grid.

```tsx
import { HomePage } from 'ardo/theme'

function Home() {
  return <HomePage />
}
```

Reads from frontmatter:

```yaml
---
layout: home
hero:
  name: Project Name
  text: Tagline text
  tagline: Longer description
  actions:
    - text: Get Started
      link: /guide/getting-started
      theme: brand
    - text: View on GitHub
      link: https://github.com/...
      theme: alt
features:
  - title: Feature One
    icon: '⚡'
    details: Description of the feature.
  - title: Feature Two
    icon: '🎨'
    details: Another feature description.
---
```

## UI Components

### ThemeToggle

Dark/light mode toggle button.

```tsx
import { ThemeToggle } from 'ardo/theme'

<ThemeToggle />
```

### Search

Search dialog component with keyboard shortcuts.

```tsx
import { Search } from 'ardo/theme'

<Search />
```

Features:

- `Cmd+K` / `Ctrl+K` keyboard shortcut
- Full-text search across all pages
- Keyboard navigation

### CodeBlock

Syntax-highlighted code block with copy button.

```tsx
import { CodeBlock } from 'ardo/theme'

<CodeBlock
  code="const x = 1"
  language="typescript"
  title="example.ts"
  lineNumbers={true}
  highlightLines={[1, 3]}
/>
```

#### Props

| Prop             | Type       | Default  | Description             |
| ---------------- | ---------- | -------- | ----------------------- |
| `code`           | `string`   | required | The code to display     |
| `language`       | `string`   | `'text'` | Programming language    |
| `title`          | `string`   | -        | Optional filename/title |
| `lineNumbers`    | `boolean`  | `false`  | Show line numbers       |
| `highlightLines` | `number[]` | `[]`     | Lines to highlight      |

### CodeGroup

Tabbed code blocks for showing multiple languages/variants.

```tsx
import { CodeGroup } from 'ardo/theme'

<CodeGroup
  items={[
    { title: 'npm', code: 'npm install ardo', language: 'bash' },
    { title: 'pnpm', code: 'pnpm add ardo', language: 'bash' },
    { title: 'yarn', code: 'yarn add ardo', language: 'bash' },
  ]}
/>
```

### Container

Callout/admonition boxes for tips, warnings, etc.

```tsx
import { Container, Tip, Warning, Danger, Info, Note } from 'ardo/theme'

// Generic container
<Container type="tip" title="Pro Tip">
  Content here
</Container>

// Or use the specific variants
<Tip title="Pro Tip">Helpful information</Tip>
<Warning title="Warning">Be careful!</Warning>
<Danger title="Danger">This is dangerous!</Danger>
<Info title="Info">Additional information</Info>
<Note title="Note">A note to the reader</Note>
```

#### Container Types

| Type      | Color  | Use Case                              |
| --------- | ------ | ------------------------------------- |
| `tip`     | Green  | Helpful hints and best practices      |
| `warning` | Yellow | Potential issues to be aware of       |
| `danger`  | Red    | Breaking changes or critical warnings |
| `info`    | Blue   | Additional context                    |
| `note`    | Purple | General notes                         |

### Tabs

Tabbed content panels.

```tsx
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'ardo/theme'

<Tabs>
  <TabList>
    <Tab>React</Tab>
    <Tab>Vue</Tab>
    <Tab>Svelte</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>React content here</TabPanel>
    <TabPanel>Vue content here</TabPanel>
    <TabPanel>Svelte content here</TabPanel>
  </TabPanels>
</Tabs>
```

### CopyButton

Button to copy text to clipboard.

```tsx
import { CopyButton } from 'ardo/theme'

<CopyButton text="npm install ardo" />
```

## Customizing Components

All components use CSS custom properties for styling. You can override them in your CSS:

```css
:root {
  --press-c-brand: #your-color;
  --press-c-bg: #your-background;
  --press-c-text: #your-text-color;
}
```

For more extensive customization, see the [Custom Theme](/guide/custom-theme) guide.

## Replacing Components

You can replace any component by creating your own and using it instead:

```tsx
// Your custom header
function MyHeader() {
  const theme = useThemeConfig()
  return <header className="my-header">{/* Your custom implementation */}</header>
}

// Use it in your layout
function MyDocPage({ children }) {
  return (
    <div>
      <MyHeader />
      <Sidebar />
      <Content>{children}</Content>
    </div>
  )
}
```
