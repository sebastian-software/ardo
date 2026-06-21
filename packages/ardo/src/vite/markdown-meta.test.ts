import { describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { transformMarkdownMeta } from "./markdown-meta"

const routesDir = "/site/app/routes"
const config = resolveConfig(
  {
    title: "Docs",
    titleSeparator: " | ",
    description: "Site description",
    siteUrl: "https://example.com/docs",
    metadata: {
      image: "/social.png",
      twitterSite: "@docs",
    },
  },
  "/site"
)

describe("transformMarkdownMeta", () => {
  it("adds Open Graph, Twitter, and canonical metadata from page and site defaults", () => {
    const result = transformMarkdownMeta(
      'export const frontmatter = { title: "Guide", description: "Guide description" }\n',
      `${routesDir}/guide/index.mdx`,
      { routesDir, resolvedConfig: config }
    )

    expect(result?.code).toContain('{ property: "og:title", content: "Guide | Docs" }')
    expect(result?.code).toContain('{ property: "og:description", content: "Guide description" }')
    expect(result?.code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://example.com/docs/guide" }'
    )
    expect(result?.code).toContain(
      '{ property: "og:image", content: "https://example.com/docs/social.png" }'
    )
    expect(result?.code).toContain('{ name: "twitter:card", content: "summary_large_image" }')
    expect(result?.code).toContain('{ name: "twitter:site", content: "@docs" }')
  })

  it("allows page frontmatter to override social metadata", () => {
    const result = transformMarkdownMeta(
      [
        'export const frontmatter = { title: "Guide",',
        'ogTitle: "Social title",',
        'ogImage: "https://cdn.example.com/og.png",',
        'twitterCard: "summary",',
        'canonical: "https://canonical.example.com/guide" }',
      ].join(" "),
      `${routesDir}/guide/intro.mdx`,
      { routesDir, resolvedConfig: config }
    )

    expect(result?.code).toContain('{ property: "og:title", content: "Social title" }')
    expect(result?.code).toContain(
      '{ property: "og:image", content: "https://cdn.example.com/og.png" }'
    )
    expect(result?.code).toContain('{ name: "twitter:card", content: "summary" }')
    expect(result?.code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://canonical.example.com/guide" }'
    )
  })

  it("applies the configured base path to generated canonical route URLs", () => {
    const result = transformMarkdownMeta(
      'export const frontmatter = { title: "Guide" }\n',
      `${routesDir}/guide/index.mdx`,
      {
        routesDir,
        resolvedConfig: resolveConfig(
          {
            title: "Docs",
            siteUrl: "https://example.com",
            base: "/docs/",
          },
          "/site"
        ),
      }
    )

    expect(result?.code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://example.com/docs/guide" }'
    )
  })

  it("omits relative canonical and social image URLs when siteUrl is not configured", () => {
    const result = transformMarkdownMeta(
      [
        'export const frontmatter = { title: "Guide",',
        'canonical: "/guide",',
        'ogImage: "/og.png",',
        'twitterImage: "/twitter.png" }',
      ].join(" "),
      `${routesDir}/guide/index.mdx`,
      {
        routesDir,
        resolvedConfig: resolveConfig(
          {
            title: "Docs",
          },
          "/site"
        ),
      }
    )

    expect(result?.code).not.toContain('rel: "canonical"')
    expect(result?.code).not.toContain('property: "og:url"')
    expect(result?.code).not.toContain('property: "og:image"')
    expect(result?.code).not.toContain('name: "twitter:image"')
  })

  it("normalizes frontmatter URL values before building metadata tags", () => {
    const result = transformMarkdownMeta(
      [
        'export const frontmatter = { title: "Guide",',
        'canonical: "  https://canonical.example.com/guide  ",',
        'ogImage: "//cdn.example.com/og.png" }',
      ].join(" "),
      `${routesDir}/guide/intro.mdx`,
      { routesDir, resolvedConfig: config }
    )

    expect(result?.code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://canonical.example.com/guide" }'
    )
    expect(result?.code).toContain('{ property: "og:image", content: "//cdn.example.com/og.png" }')
  })

  it("keeps escaped quotes in frontmatter values", () => {
    const result = transformMarkdownMeta(
      'export const frontmatter = { title: "He said \\"hi\\"" }\n',
      `${routesDir}/guide/intro.mdx`,
      { routesDir, resolvedConfig: config }
    )

    expect(result?.code).toContain('{ title: "He said \\"hi\\" | Docs" }')
  })
})
