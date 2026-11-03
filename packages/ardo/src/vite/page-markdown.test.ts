import { describe, expect, it } from "vitest"

import type { ResolvedConfig } from "../config/types"

import { resolvePageMarkdownPath } from "./page-markdown"

const routesDir = "/project/app/routes"

const config: ResolvedConfig = {
  base: "/docs/",
  contentDir: "/project/app/routes",
  deploymentBase: "/docs/",
  description: "Framework docs",
  head: [],
  i18n: false,
  lang: "en",
  linkCheck: {
    enabled: true,
  },
  markdown: {},
  metadata: {},
  outDir: "build",
  project: {},
  redirects: [],
  root: "/project",
  seo: {
    llms: true,
    robots: false,
    sitemap: false,
  },
  sidebar: {},
  siteUrl: "https://example.com",
  srcDir: "app/routes",
  title: "Ardo",
  titleSeparator: " | ",
  versioning: false,
}

describe("resolvePageMarkdownPath", () => {
  it("names the page's Markdown file at its URL with .md appended, under the deployment base", () => {
    expect(
      resolvePageMarkdownPath({
        command: "build",
        config,
        filePath: `${routesDir}/guide/start.mdx`,
        routesDir,
      })
    ).toBe("/docs/guide/start.md")
  })

  it("names index.md for a directory root", () => {
    expect(
      resolvePageMarkdownPath({
        command: "build",
        config,
        filePath: `${routesDir}/index.md`,
        routesDir,
      })
    ).toBe("/docs/index.md")
  })

  it("names nothing in the dev server, which writes no Markdown files", () => {
    expect(
      resolvePageMarkdownPath({
        command: "serve",
        config,
        filePath: `${routesDir}/guide/start.mdx`,
        routesDir,
      })
    ).toBeUndefined()
  })

  it("names nothing when the build writes no Markdown files", () => {
    const filePath = `${routesDir}/guide/start.mdx`
    expect(
      resolvePageMarkdownPath({ command: "build", config: undefined, filePath, routesDir })
    ).toBeUndefined()
    expect(
      resolvePageMarkdownPath({
        command: "build",
        config: { ...config, seo: { ...config.seo, llms: false } },
        filePath,
        routesDir,
      })
    ).toBeUndefined()
    expect(
      resolvePageMarkdownPath({
        command: "build",
        config: { ...config, seo: { ...config.seo, llms: { pages: false } } },
        filePath,
        routesDir,
      })
    ).toBeUndefined()
  })

  it("names nothing for TSX routes and for files outside the routes directory", () => {
    expect(
      resolvePageMarkdownPath({
        command: "build",
        config,
        filePath: `${routesDir}/home.tsx`,
        routesDir,
      })
    ).toBeUndefined()
    expect(
      resolvePageMarkdownPath({
        command: "build",
        config,
        filePath: "/project/elsewhere/start.md",
        routesDir,
      })
    ).toBeUndefined()
  })
})
