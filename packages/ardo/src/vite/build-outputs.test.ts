import { describe, expect, it } from "vitest"

import type { RouteManifestEntry } from "./route-manifest"

import { resolveConfig } from "../config"
import {
  checkInternalLinks,
  collectRedirects,
  generateNetlifyRedirects,
  generateRobots,
  generateSitemap,
  generateVercelRedirects,
} from "./build-outputs"

const baseConfig = resolveConfig(
  {
    title: "Docs",
    base: "/docs/",
    siteUrl: "https://example.com",
  },
  "/site"
)

const entries: RouteManifestEntry[] = [
  {
    anchors: ["overview"],
    content: "[Valid](/guide#overview) [Missing](/missing) [Bad anchor](/guide#nope)",
    filePath: "/site/app/routes/guide.mdx",
    frontmatter: { redirectFrom: ["/old-guide"] },
    lastmod: new Date("2026-01-02T03:04:05.000Z"),
    path: "/guide",
  },
  {
    anchors: [],
    content: "",
    filePath: "/site/app/routes/hidden.mdx",
    frontmatter: { sitemap: false },
    lastmod: new Date("2026-01-03T03:04:05.000Z"),
    path: "/hidden",
  },
]

describe("build outputs", () => {
  it("generates sitemap and robots content from route entries and config", () => {
    expect(generateSitemap(entries, baseConfig)).toContain(
      "<loc>https://example.com/docs/guide</loc>"
    )
    expect(generateSitemap(entries, baseConfig)).not.toContain("/hidden")
    expect(generateRobots(baseConfig)).toContain("Sitemap: https://example.com/docs/sitemap.xml")
  })

  it("combines configured and frontmatter redirects for provider outputs", () => {
    const redirects = collectRedirects(entries, {
      ...baseConfig,
      redirects: [{ from: "/legacy", to: "/guide" }],
    })

    expect(redirects).toStrictEqual([
      { from: "/legacy", to: "/guide" },
      { from: "/old-guide", to: "/guide" },
    ])
    expect(generateNetlifyRedirects(redirects)).toContain("/legacy /guide 301")
    expect(generateVercelRedirects(redirects)).toContain('"source": "/old-guide"')
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
})
