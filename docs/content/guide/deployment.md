---
title: Deployment
description: Deploy your Ardo documentation site to GitHub Pages, Netlify, Vercel, and more.
---

# Deployment

Ardo produces a fully static site out of the box. When you run `pnpm build`, TanStack Start prerenders every page to static HTML (via `prerender: enabled`), so no server is needed at runtime.

The build output is located in `dist/client/` and can be deployed to any static hosting provider.

## GitHub Pages

### Step 1: Configure Base Path

If your site is deployed to a subdirectory (e.g. `https://username.github.io/my-docs/`), set the `base` option in `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  base: '/my-docs/',
  plugins: [ardo({ /* ... */ })],
})
```

If you deploy to the root (`https://username.github.io/`), no `base` configuration is needed.

### Step 2: Add a GitHub Actions Workflow

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: dist/client

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 3: Enable GitHub Pages

In your repository settings, go to **Pages** and set the source to **GitHub Actions**.

Push to `main` and the workflow will build and deploy your site automatically.

:::tip
Projects scaffolded with `pnpm create ardo@latest` include this workflow out of the box.
:::

## Netlify

Netlify requires no workflow file. Connect your Git repository in the Netlify dashboard and configure:

- **Build command:** `pnpm build`
- **Publish directory:** `dist/client`

Netlify automatically detects the Node.js version from your `package.json` engines field or an `.nvmrc` file.

For subdirectory deployments, set `base` in `vite.config.ts` as described above.

## Vercel

Connect your Git repository in the Vercel dashboard and configure:

- **Build command:** `pnpm build`
- **Output directory:** `dist/client`
- **Framework preset:** Other

Vercel handles routing and CDN configuration automatically.

## Other Providers

Since Ardo outputs plain static files to `dist/client/`, it works with any static hosting provider (Cloudflare Pages, AWS S3 + CloudFront, Firebase Hosting, etc.). Use `pnpm build` as the build command and `dist/client` as the output directory.
