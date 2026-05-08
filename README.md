# Ardo

<div align="center">

<img src="./logo.svg" alt="Ardo Logo" width="120" height="120">

**Modern, open documentation for React teams.**

[![Powered by Sebastian Software](https://img.shields.io/badge/Powered%20by-Sebastian%20Software-00718d?style=flat-square)](https://oss.sebastian-software.com)
[![CI](https://github.com/sebastian-software/ardo/actions/workflows/ci.yml/badge.svg)](https://github.com/sebastian-software/ardo/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/ardo.svg)](https://www.npmjs.com/package/ardo)
[![npm downloads](https://img.shields.io/npm/dm/ardo.svg)](https://www.npmjs.com/package/ardo)
[![License](https://img.shields.io/npm/l/ardo.svg)](https://github.com/sebastian-software/ardo/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D22-green.svg)](https://nodejs.org/)

[Documentation](https://ardo-docs.dev) ·
[Getting Started](https://ardo-docs.dev/guide/getting-started) ·
[API Reference](https://ardo-docs.dev/api-reference)

</div>

---

## Why Ardo exists

You build your product in React. Your components are React. Your design system, providers, hooks, examples, and internal tools are React.

Then documentation work starts and suddenly the docs stack asks your team to switch mental models: another component system, another router, another theming model, another place where your existing UI does not quite fit.

Ardo keeps docs inside the React stack. It is a static documentation framework built on React 19, React Router 7, Vite 8, MDX, TypeScript, and Vanilla Extract. It gives React teams the simplicity people like in VitePress, without leaving React or handing their docs to a closed platform.

## What you get

**Real React components in MDX.** Import your own design system, providers, interactive examples, or playgrounds. No Astro island boundary, no Vue rewrite, no hosted docs runtime.

**A modern Vite-powered docs build.** Ardo uses Vite 8 with Rolldown and React Router's static prerendering model. You get fast local iteration, static HTML output, and deployment to any host that can serve files.

**TypeScript API docs from source.** Built-in TypeDoc integration turns your public TypeScript exports into linked API reference pages during the docs build.

**A polished default theme you can still own.** Light and dark mode, search, sidebar navigation, TOC, code highlighting, tabs, callouts, Tailwind v4, and type-safe Vanilla Extract tokens ship with the default UI.

**Open and self-hostable.** Ardo is an npm package and Vite plugin. Your content stays in your repo, your build runs in your pipeline, and your output is static.

## How Ardo compares

Ardo is not trying to be every documentation product. It is built for a specific team: you already use React, you want static docs, and you want the docs code to feel like the rest of your app.

|                          | **Ardo**                       | **Docusaurus**      | **Starlight**            | **VitePress**     | **Nextra**   | **Fumadocs**              | **Mintlify**      |
| ------------------------ | ------------------------------ | ------------------- | ------------------------ | ----------------- | ------------ | ------------------------- | ----------------- |
| Best fit                 | React teams, static docs       | Mature OSS docs     | Content-heavy Astro docs | Vue docs          | Next.js      | Composable React docs     | Hosted API docs   |
| UI framework             | React 19                       | React               | Astro                    | Vue               | Next.js      | React                     | Hosted platform   |
| Build model              | Vite 8 + React Router          | Webpack             | Astro/Vite               | Vite              | Next.js      | React framework dependent | SaaS/Git workflow |
| React component reuse    | Native                         | Native              | Via islands              | No                | Native       | Native                    | Limited/platform  |
| TypeScript API reference | TypeDoc built in               | Plugin              | Plugin                   | External          | TSDoc        | Type tables/OpenAPI       | OpenAPI/API tools |
| Ownership                | Open source, self-hosted files | Open source         | Open source              | Open source       | Open source  | Open source               | Hosted platform   |
| Measured Ardo first page | ~155 KB gzip including assets  | Heavier React stack | Lighter non-React stack  | Lighter Vue stack | Next runtime | Depends on framework      | Platform hosted   |

The honest tradeoff: Starlight and VitePress can be lighter when your docs are mostly prose and code samples. Docusaurus is more mature for versioning, i18n, and plugins. Fumadocs is more composable if you want to assemble a custom docs framework. Mintlify is stronger when you want a hosted docs product with analytics, AI features, and API playgrounds.

Ardo's value is narrower and sharper: **React-native static docs with modern Vite tooling and full code ownership.**

<details>
<summary>Measurement note</summary>

The Ardo first-page estimate comes from `pnpm docs:build` on this repository and includes gzip-compressed JavaScript and CSS referenced by the generated homepage, including logo assets. Use it as a local build snapshot, not a universal benchmark.

</details>

## Quick start

```bash
pnpm create ardo@latest my-docs
cd my-docs
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Add an `.mdx` file to `app/routes/`, and Ardo adds it to the generated sidebar.

## Configuration

Build-time configuration lives in the `ardo()` Vite plugin:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { ardo } from "ardo/vite"

export default defineConfig({
  plugins: [
    tailwindcss(),
    ardo({
      title: "My Documentation",
      description: "Docs for my React library",
    }),
  ],
})
```

UI configuration lives in React, where React teams expect it:

```tsx
// app/root.tsx
import { ArdoRoot, ArdoRootLayout } from "ardo/ui"
import config from "virtual:ardo/config"
import sidebar from "virtual:ardo/sidebar"
import "ardo/ui/styles.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

export default function Root() {
  return <ArdoRoot config={config} sidebar={sidebar} />
}
```

Swap the header, sidebar, footer, search, or content components when you need deeper control. They are React components, not theme-file magic.

## Project structure

```text
my-docs/
├── app/
│   ├── routes/            # MDX, Markdown, and TSX routes
│   │   ├── guide/
│   │   │   └── getting-started.mdx
│   │   └── home.tsx
│   ├── root.tsx           # ArdoRoot + React Router shell
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   └── app.css            # Tailwind v4 utility layers
├── vite.config.ts         # Vite + Ardo configuration
├── react-router.config.ts # Static prerender configuration
└── package.json
```

## Deployment

Ardo builds to static HTML and assets. Deploy it to GitHub Pages, Vercel, Netlify, Cloudflare Pages, or a plain file server. Projects created with `create-ardo` include a GitHub Pages workflow.

See the [Deployment Guide](https://ardo-docs.dev/guide/deployment) for provider-specific setup.

## Packages

| Package                                   | Description                                                  | Version                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [**ardo**](./packages/ardo)               | Core framework: Vite plugin, runtime hooks, theme components | [![npm](https://img.shields.io/npm/v/ardo.svg)](https://www.npmjs.com/package/ardo)               |
| [**create-ardo**](./packages/create-ardo) | Scaffolding CLI for new projects                             | [![npm](https://img.shields.io/npm/v/create-ardo.svg)](https://www.npmjs.com/package/create-ardo) |

## Development

```bash
git clone https://github.com/sebastian-software/ardo.git
cd ardo
pnpm install
pnpm build
pnpm docs:dev
```

## License

[MIT](./LICENSE)

---

<!-- sebastian-software-branding:start -->
<p align="center">
  <a href="https://oss.sebastian-software.com">
    <img src="https://sebastian-brand.vercel.app/sebastian-software/logo-software.svg" alt="Sebastian Software" width="240" />
  </a>
</p>

<p align="center">
  <a href="https://oss.sebastian-software.com">Open Source at Sebastian Software</a><br />
  Copyright &copy; 2026 Sebastian Software GmbH
</p>
<!-- sebastian-software-branding:end -->
