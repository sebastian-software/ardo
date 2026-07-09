import path from "node:path"
import { describe, expect, it } from "vitest"

import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { resolveConfig } from "../config"
import {
  checkInternalLinks,
  collectRedirects,
  createBuildOutputAssets,
  generateNetlifyRedirects,
  generateRobots,
  generateSitemap,
  generateVercelRedirects,
} from "./build-outputs"
import { generateVersionsJson } from "./build-versioning"
import { createPageMetadata } from "./page-metadata"
import { createCurrentRouteIdentity } from "./route-identity"

const baseConfig = resolveConfig(
  {
    title: "Docs",
    base: "/docs/",
    siteUrl: "https://example.com",
  },
  "/site"
)

const entries = createEntries(baseConfig)

function createEntries(config: ResolvedConfig): RouteManifestEntry[] {
  return [
    entry(config, {
      anchors: ["overview"],
      content:
        "# Guide\n\nimport Demo from './demo'\n\n[Valid](/guide#overview) [Missing](/missing) [Bad anchor](/guide#nope)\n\n<Tip>\nKeep this text.\n</Tip>\n\nWrap with `<ArdoRoot>` and close via `</ArdoRoot>` in your entry.\n\n```tsx\n<Demo />\nexport const value = true\n```",
      filePath: "/site/app/routes/guide.mdx",
      frontmatter: {
        description: "Guide description",
        redirectFrom: ["/old-guide"],
        title: "Guide",
      },
      lastmod: new Date("2026-01-02T03:04:05.000Z"),
      routePath: "/guide",
      source: "markdown",
    }),
    entry(config, {
      anchors: [],
      content: "",
      filePath: "/site/app/routes/hidden.mdx",
      frontmatter: { sitemap: false },
      lastmod: new Date("2026-01-03T03:04:05.000Z"),
      routePath: "/hidden",
      source: "markdown",
    }),
    entry(config, {
      anchors: [],
      content: "export default function Home() { return <Home /> }",
      filePath: "/site/app/routes/home.tsx",
      frontmatter: {},
      lastmod: new Date("2026-01-04T03:04:05.000Z"),
      routePath: "/",
      source: "tsx",
    }),
  ]
}

function entry(
  config: ResolvedConfig,
  input: Omit<RouteManifestEntry, "identity" | "metadata" | "path" | "publicPath">
): RouteManifestEntry {
  const identity = createCurrentRouteIdentity(input.routePath, config)
  return {
    ...input,
    identity,
    path: identity.routePath,
    publicPath: identity.publicPath,
    metadata: createPageMetadata({
      frontmatter: input.frontmatter,
      identity,
      sourcePath: path.relative(config.contentDir, input.filePath),
    }),
    routePath: identity.routePath,
  }
}

describe("build outputs", () => {
  it("generates sitemap and robots content from route entries and config", () => {
    expect(generateSitemap(entries, baseConfig)).toContain(
      "<loc>https://example.com/docs/guide</loc>"
    )
    expect(generateSitemap(entries, baseConfig)).not.toContain("/hidden")
    expect(generateRobots(baseConfig)).toContain("Sitemap: https://example.com/docs/sitemap.xml")
  })

  it("uses the current version path for sitemap URLs", () => {
    const versionedConfig = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        siteUrl: "https://example.com",
        versioning: {
          current: "v3",
          versions: [
            { id: "v3", label: "3.x", path: "/v3/" },
            { id: "v2", label: "2.x", path: "/v2/" },
          ],
        },
      },
      "/site"
    )

    const sitemap = generateSitemap(createEntries(versionedConfig), versionedConfig)

    expect(sitemap).toContain("<loc>https://example.com/docs/v3/guide</loc>")
    expect(sitemap).not.toContain("/docs/v2/")
  })

  it("combines configured and frontmatter redirects for provider outputs", () => {
    const redirects = collectRedirects(entries, {
      ...baseConfig,
      redirects: [{ from: "/legacy", to: "/guide" }],
    })

    expect(redirects).toStrictEqual([
      { from: "/legacy", to: "/guide" },
      { from: "/old-guide", to: "/docs/guide" },
    ])
    expect(generateNetlifyRedirects(redirects)).toContain("/old-guide /docs/guide 301")
    expect(generateVercelRedirects(redirects)).toContain('"source": "/old-guide"')
  })

  it("adds a static root redirect and versions metadata for versioned docs", () => {
    const versionedConfig = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        versioning: {
          current: "v3",
          versions: [
            { id: "v3", label: "3.x", path: "/v3/" },
            { id: "v2", label: "2.x", path: "/v2/" },
          ],
        },
      },
      "/site"
    )
    const versionedEntries = createEntries(versionedConfig)
    const assets = createBuildOutputAssets(versionedEntries, versionedConfig)

    expect(collectRedirects(versionedEntries, versionedConfig)).toContainEqual({
      from: "/",
      to: "/docs/v3/",
    })
    expect(assets.find((asset) => asset.fileName === "index.html")?.source).toContain(
      "url=/docs/v3/"
    )
    expect(assets.find((asset) => asset.fileName === "versions.json")?.source).toBe(
      generateVersionsJson(versionedConfig)
    )
    expect(generateVersionsJson(versionedConfig)).toContain('"path": "/docs/v2/"')
  })

  it("adds locale-prefixed redirects and sitemap URLs when i18n URL prep is active", () => {
    const versionedConfig = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        versioning: {
          current: "v3",
          versions: [{ id: "v3", label: "3.x", path: "/v3/" }],
        },
        i18n: {
          defaultLocale: "en",
          locales: [{ id: "en" }, { id: "de" }],
        },
      },
      "/site"
    )
    const versionedEntries = createEntries(versionedConfig)

    expect(collectRedirects(versionedEntries, versionedConfig)).toContainEqual({
      from: "/",
      to: "/docs/v3/en/",
    })
    expect(collectRedirects(versionedEntries, versionedConfig)).toContainEqual({
      from: "/docs/v3/",
      to: "/docs/v3/en/",
    })
    expect(generateSitemap(versionedEntries, versionedConfig)).toContain(
      "<loc>/docs/v3/en/guide</loc>"
    )
    expect(generateVersionsJson(versionedConfig)).toContain('"path": "/docs/v3/"')
  })

  it("can keep the root page when versioning disables the root redirect", () => {
    const versionedConfig = resolveConfig(
      {
        title: "Docs",
        versioning: {
          current: "v3",
          rootRedirect: false,
          versions: [{ id: "v3", path: "/v3/" }],
        },
      },
      "/site"
    )

    expect(collectRedirects(entries, versionedConfig)).not.toContainEqual({
      from: "/",
      to: "/v3/",
    })
  })

  it("reports missing internal routes and anchors", () => {
    expect(checkInternalLinks(entries, baseConfig)).toStrictEqual([
      {
        filePath: "/site/app/routes/guide.mdx",
        href: "/missing",
        message: "Missing internal route: /missing",
      },
      {
        filePath: "/site/app/routes/guide.mdx",
        href: "/guide#nope",
        message: 'Missing anchor "nope" on /guide',
      },
    ])
  })

  it("emits generated llms text assets from markdown route entries", () => {
    const assets = createBuildOutputAssets(entries, baseConfig)
    const llms = assets.find((asset) => asset.fileName === "llms.txt")
    const llmsFull = assets.find((asset) => asset.fileName === "llms-full.txt")

    expect(llms?.source).toContain("# Docs")
    expect(llms?.source).toContain("- [Guide](https://example.com/docs/guide): Guide description")
    expect(llms?.source).toContain("- [Full documentation](https://example.com/docs/llms-full.txt)")
    expect(llmsFull?.source).toContain("## Guide")
    expect(llmsFull?.source).toContain("Source: https://example.com/docs/guide")
    expect(llmsFull?.source).toContain("Keep this text.")
    expect(llmsFull?.source).toContain(
      "Wrap with `<ArdoRoot>` and close via `</ArdoRoot>` in your entry."
    )
    expect(llmsFull?.source).toContain("<Demo />")
    expect(llmsFull?.source).toContain("export const value = true")
    expect(llmsFull?.source).not.toContain("import Demo")
    expect(llmsFull?.source).not.toContain("<Tip>")
    expect(llmsFull?.source).not.toContain("export default function Home")
  })

  it("allows llms generation to be disabled or customized", () => {
    expect(
      createBuildOutputAssets(entries, {
        ...baseConfig,
        seo: { llms: false },
      }).some((asset) => asset.fileName === "llms.txt")
    ).toBe(false)

    const customAssets = createBuildOutputAssets(entries, {
      ...baseConfig,
      seo: {
        llms: {
          fullFileName: "context.md",
          includeFull: false,
          indexFileName: "ai.txt",
          title: "AI Context",
        },
      },
    })

    expect(customAssets.some((asset) => asset.fileName === "ai.txt")).toBe(true)
    expect(customAssets.some((asset) => asset.fileName === "context.md")).toBe(false)
    expect(customAssets.find((asset) => asset.fileName === "ai.txt")?.source).toContain(
      "# AI Context"
    )
  })
})
