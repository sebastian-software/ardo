---
title: Troubleshooting
description: Common issues and solutions when using Ardo
---

# Troubleshooting

Common issues and their solutions.

## Installation Issues

### `Cannot find module 'ardo'`

Make sure you have installed all required dependencies:

```bash
pnpm add ardo @tanstack/react-start @tanstack/react-router react react-dom
```

### Node.js Version Error

Ardo requires Node.js 22 or higher. Check your version:

```bash
node --version
```

If you need to upgrade, consider using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm).

## Build Issues

### `Failed to resolve import`

Ensure your `vite.config.ts` has the Ardo plugin configured:

```typescript
import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  plugins: [
    ardo({
      /* config */
    }),
  ],
})
```

### TypeScript Errors in Routes

If you see type errors in generated route files, try:

1. Run `pnpm build` to regenerate route types
2. Restart your TypeScript server in your editor
3. Check that `tsconfig.json` includes the `src` directory

### Build Fails with Memory Error

For large documentation sites, increase Node.js memory:

```bash
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

## Development Issues

### Hot Reload Not Working

1. Check that you're editing files in the `content/` directory
2. Ensure Vite dev server is running
3. Try restarting the dev server

### Styles Not Applied

Make sure you're importing the Ardo styles. If using a custom theme, verify your CSS imports.

### Search Not Working

Search is built at build time. In development:

1. Run `pnpm build` once to generate the search index
2. Restart the dev server

For production, the search index is automatically generated during build.

## Content Issues

### Markdown Not Rendering

Check that your file:

1. Has a `.md` or `.mdx` extension
2. Is located in the `content/` directory
3. Has valid frontmatter (if using frontmatter)

### Code Blocks Not Highlighted

Syntax highlighting uses Shiki. Ensure you specify the language:

````markdown
```javascript
const foo = 'bar'
```
````

Supported languages: [Shiki Languages](https://shiki.style/languages)

### Images Not Loading

Use relative paths from your markdown file:

```markdown
![Alt text](./images/screenshot.png)
```

Or absolute paths from the public directory:

```markdown
![Alt text](/images/screenshot.png)
```

## Deployment Issues

### 404 on Page Refresh

For static hosting (GitHub Pages, Netlify, etc.), ensure your hosting is configured for SPA routing, or use Ardo's static prerendering.

### Base Path Issues

If deploying to a subdirectory, set the `base` option in `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/my-docs/',
  plugins: [
    ardo({
      /* config */
    }),
  ],
})
```

## Getting Help

If your issue isn't listed here:

1. Check the [GitHub Issues](https://github.com/sebastian-software/ardo/issues) for similar problems
2. Open a [GitHub Discussion](https://github.com/sebastian-software/ardo/discussions) for questions
3. Create a new issue with a minimal reproduction
