import { describe, expect, it } from "vitest"

import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { createLlmsTextAssets, generateLlmsFullTxt, generateLlmsTxt } from "./llms-text"

const config: ResolvedConfig = {
  base: "/docs/",
  brand: {},
  contentDir: "/tmp/routes",
  description: "Framework docs",
  head: [],
  lang: "en",
  linkCheck: {
    enabled: true,
  },
  markdown: {},
  metadata: {},
  outDir: "build",
  project: {},
  redirects: [],
  root: "/tmp",
  seo: {
    llms: {
      fullFileName: "llms-full.txt",
      includeFull: true,
      indexFileName: "llms.txt",
    },
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

function entry(overrides: Partial<RouteManifestEntry>): RouteManifestEntry {
  return {
    anchors: [],
    content: "",
    filePath: "/tmp/page.mdx",
    frontmatter: {},
    lastmod: new Date("2026-01-01T00:00:00.000Z"),
    path: "/guide/page",
    source: "markdown",
    ...overrides,
  }
}

describe("llms-text", () => {
  it("generates an index with absolute links and excludes opted-out pages", () => {
    const text = generateLlmsTxt(
      [
        entry({ frontmatter: { title: "Guide", description: "Start here" }, path: "/guide" }),
        entry({ frontmatter: { llms: false, title: "Private" }, path: "/private" }),
      ],
      config
    )

    expect(text).toContain("# Ardo")
    expect(text).toContain("- [Guide](https://example.com/docs/guide): Start here")
    expect(text).not.toContain("Private")
  })

  it("strips duplicate headings and MDX syntax from full text", () => {
    const text = generateLlmsFullTxt(
      [
        entry({
          content: "# Guide\n\n<Demo />\n\nKeep this paragraph.\n\n```tsx\n<Demo />\n```",
          frontmatter: { title: "Guide" },
          path: "/guide",
        }),
      ],
      config
    )

    expect(text).toContain("Keep this paragraph.")
    expect(text).toContain("```tsx\n<Demo />\n```")
    expect(text).not.toContain("# Guide\n\n# Guide")
    expect(text).not.toContain("<Demo />\n\nKeep")
  })

  it("uses configured asset names", () => {
    expect(createLlmsTextAssets([], config).map((asset) => asset.fileName)).toStrictEqual([
      "llms.txt",
      "llms-full.txt",
    ])
  })
})
