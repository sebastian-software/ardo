import fs from "node:fs/promises"
import { describe, expect, it } from "vitest"

import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { resolveConfig } from "../config"
import { createLlmsTextAssets, generateLlmsFullTxt, generateLlmsTxt } from "./llms-text"
import { createPageMetadata } from "./page-metadata"
import { createCurrentRouteIdentity } from "./route-identity"

const config: ResolvedConfig = {
  base: "/docs/",
  brand: {},
  contentDir: "/tmp/routes",
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
  const routePath = overrides.routePath ?? "/guide/page"
  const identity = createCurrentRouteIdentity(routePath, config)
  const frontmatter = overrides.frontmatter ?? {}

  return {
    anchors: [],
    content: "",
    filePath: "/tmp/page.mdx",
    frontmatter,
    identity,
    lastmod: new Date("2026-01-01T00:00:00.000Z"),
    metadata: createPageMetadata({ frontmatter, identity, sourcePath: "page.mdx" }),
    path: identity.routePath,
    publicPath: identity.publicPath,
    routePath: identity.routePath,
    source: "markdown",
    ...overrides,
  }
}

describe("llms-text", () => {
  it("generates an index with absolute links and excludes opted-out pages", () => {
    const text = generateLlmsTxt(
      [
        entry({ frontmatter: { title: "Guide", description: "Start here" }, routePath: "/guide" }),
        entry({ frontmatter: { llms: false, title: "Private" }, routePath: "/private" }),
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
          routePath: "/guide",
        }),
      ],
      config
    )

    expect(text).toContain("Keep this paragraph.")
    expect(text).toContain("```tsx\n<Demo />\n```")
    expect(text).not.toContain("# Guide\n\n# Guide")
    expect(text).not.toContain("<Demo />\n\nKeep")
  })

  it("does not trim or collapse whitespace inside authored code examples", () => {
    const code =
      '    import { Demo } from "./demo"\n    <Demo />  \n\n~~~tsx\nconst first = 1  \n\n\nconst last = 2  \n~~~\n'
    const text = generateLlmsFullTxt([entry({ content: code })], config)
    expect(text).toContain(code)
  })

  it("uses configured asset names", () => {
    expect(createLlmsTextAssets([], config).map((asset) => asset.fileName)).toStrictEqual([
      "llms.txt",
      "llms-full.txt",
    ])
  })

  it("emits versioned instructions with a versioned full-text link alongside the latest aliases", () => {
    const versionedConfig = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        siteUrl: "https://example.com",
        versioning: {
          current: "v6",
          versions: [
            { id: "v6", path: "/v6/" },
            { id: "v5", path: "/v5/" },
          ],
        },
      },
      "/tmp"
    )
    const assets = createLlmsTextAssets([], versionedConfig)
    expect(assets.map((asset) => asset.fileName)).toStrictEqual([
      "llms.txt",
      "llms-full.txt",
      "v6/llms.txt",
      "v6/llms-full.txt",
    ])
    expect(assets.find((asset) => asset.fileName === "llms.txt")?.source).toContain(
      "https://example.com/docs/llms-full.txt"
    )
    expect(assets.find((asset) => asset.fileName === "v6/llms.txt")?.source).toContain(
      "https://example.com/docs/v6/llms-full.txt"
    )
  })

  it("keeps real setup-guide links navigable in latest and versioned full-text exports", async () => {
    const source = await fs.readFile(
      new URL("../../../../docs/app/routes/guide/getting-started.mdx", import.meta.url),
      "utf8"
    )
    const versionedConfig = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        siteUrl: "https://example.com",
        versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] },
      },
      "/tmp"
    )
    const page = entry({
      content: source,
      publicPath: "/docs/v6/guide/getting-started",
      routePath: "/guide/getting-started",
      frontmatter: { title: "Getting Started" },
    })
    const full = createLlmsTextAssets([page], versionedConfig).filter((asset) =>
      asset.fileName.endsWith("llms-full.txt")
    )
    expect(full).toHaveLength(2)
    for (const asset of full) {
      expect(asset.source).toContain(
        "[tested Basic example](<https://example.com/docs/v6/guide/agent-instructions/#the-basic-example>)"
      )
      expect(asset.source).toContain(
        "[manual installation](<https://example.com/docs/v6/guide/getting-started#manual-installation>)"
      )
      expect(asset.source).toContain('import { defineArdoConfig } from "ardo/config"')
    }
  })

  it("respects custom filenames and disabled full text in versioned output", () => {
    const versionedConfig = resolveConfig(
      {
        title: "Docs",
        versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] },
        seo: { llms: { indexFileName: "agent/index.txt", includeFull: false } },
      },
      "/tmp"
    )
    expect(createLlmsTextAssets([], versionedConfig).map((asset) => asset.fileName)).toStrictEqual([
      "agent/index.txt",
      "v6/agent/index.txt",
    ])
  })
})
