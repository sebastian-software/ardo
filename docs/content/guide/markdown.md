---
title: Markdown Features
description: Learn about the markdown features available in React Press.
---

# Markdown Features

React Press supports all standard Markdown syntax plus some powerful extensions.

## Basic Syntax

### Headings

```markdown
# Heading 1

## Heading 2

### Heading 3

#### Heading 4
```

### Emphasis

```markdown
_italic_ or _italic_
**bold** or **bold**
**_bold and italic_**
~~strikethrough~~
```

### Lists

```markdown
- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2
```

### Links and Images

```markdown
[Link text](https://example.com)
![Alt text](/path/to/image.png)
```

## GitHub Flavored Markdown

React Press supports GitHub Flavored Markdown (GFM) out of the box.

### Tables

| Feature    | Supported |
| ---------- | --------- |
| Tables     | Yes       |
| Task Lists | Yes       |
| Autolinks  | Yes       |

### Task Lists

- [x] Write documentation
- [x] Add syntax highlighting
- [ ] Deploy to production

### Autolinks

URLs are automatically converted to links: https://tanstack.com

## Syntax Highlighting

Code blocks are automatically highlighted using [Shiki](https://shiki.matsu.io/).

```typescript
interface User {
  id: string
  name: string
  email: string
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`
}
```

### Line Highlighting

Highlight specific lines using the `{lines}` syntax:

```typescript {2,4-5}
function example() {
  const highlighted = true
  const normal = false
  const alsoHighlighted = true
  const highlighted = true
  const notHighlighted = false
}
```

### Line Numbers

Enable line numbers with `showLineNumbers`:

```typescript showLineNumbers
const first = 1
const second = 2
const third = 3
```

### Title

Add a title to your code block:

```typescript title="utils/greeting.ts"
export function greet(name: string) {
  return `Hello, ${name}!`
}
```

## Container Directives

Use container directives to highlight important information.

:::tip
This is a helpful tip for readers.
:::

:::warning
Be careful when using this feature.
:::

:::danger
This action cannot be undone!
:::

:::info
Here's some additional information.
:::

:::note
This is a note for reference.
:::

### Custom Titles

You can customize the container title:

:::tip Pro Tip
This is a pro tip with a custom title.
:::

## Code Groups

Display multiple code variants in tabs:

::: code-group

```js [JavaScript]
function greet(name) {
  return `Hello, ${name}!`
}
```

```ts [TypeScript]
function greet(name: string): string {
  return `Hello, ${name}!`
}
```

```python [Python]
def greet(name):
    return f"Hello, {name}!"
```

:::

## Custom Components

You can use React components directly in your markdown:

```markdown
import { MyComponent } from './components/MyComponent'

# My Page

<MyComponent prop="value" />
```

## Frontmatter

Add metadata to your pages using YAML frontmatter:

```yaml
---
title: Page Title
description: Page description for SEO
layout: doc
sidebar: true
outline: [2, 3]
---
```

See the [Frontmatter Reference](/guide/frontmatter) for all available options.
