import { describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import type { ResolvedConfig } from "../config/types"
import { transformMarkdownMeta } from "./markdown-meta"
import { compileMdxRouteModule } from "./mdx-compile"

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

function compileRoute(body: string): string {
  return compileMdxRouteModule({
    source: `---\ntitle: Upgrade\n---\n\n${body}`,
    markdownConfig: undefined,
    format: "mdx",
    id: `${routesDir}/guide/upgrade.mdx`,
  }).code
}

function metaOf(code: string) {
  return transformMarkdownMeta(code, `${routesDir}/guide/upgrade.mdx`, {
    routesDir,
    resolvedConfig: config,
  })
}

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

  it("injects metadata when Vite ids use slashes and routesDir uses Windows separators", () => {
    const result = transformMarkdownMeta(
      'export const frontmatter = { title: "Windows" }\n',
      "C:/site/app/routes/guide/index.mdx",
      { routesDir: "C:\\site\\app\\routes", resolvedConfig: config }
    )

    expect(result?.code).toContain('{ title: "Windows | Docs" }')
    expect(result?.code).toContain(
      '{ tagName: "link", rel: "canonical", href: "https://example.com/docs/guide" }'
    )
  })

  it("does not inject metadata for sibling directories with the same prefix", () => {
    const result = transformMarkdownMeta(
      'export const frontmatter = { title: "Old" }\n',
      "/site/app/routes-old/guide/index.mdx",
      { routesDir, resolvedConfig: config }
    )

    expect(result).toBeUndefined()
  })

  it("reads the frontmatter of a route compiled by the real MDX pipeline", () => {
    const compiled = compileMdxRouteModule({
      source: "---\ntitle: Getting Started\ndescription: Set up Ardo.\n---\n\n# Getting Started\n",
      markdownConfig: undefined,
      format: "mdx",
      id: `${routesDir}/guide/getting-started.mdx`,
    })
    const result = transformMarkdownMeta(compiled.code, `${routesDir}/guide/getting-started.mdx`, {
      routesDir,
      resolvedConfig: config,
    })

    expect(result?.code).toContain("export const meta = () =>")
    expect(result?.code).toContain('{ title: "Getting Started | Docs" }')
    expect(result?.code).toContain('{ name: "description", content: "Set up Ardo." }')
  })

  it("keeps braces, semicolons, and escaped quotes inside generated frontmatter strings", () => {
    const result = transformMarkdownMeta(
      'const _ardoFrontmatter = {\n  "title": "Use {a; b} and \\"c\\"",\n  "order": 2\n};\nexport { _ardoFrontmatter as frontmatter };\n',
      `${routesDir}/guide/tricky.mdx`,
      { routesDir, resolvedConfig: config }
    )

    expect(result?.code).toContain('{ title: "Use {a; b} and \\"c\\" | Docs" }')
  })
})

describe("compiled route modules", () => {
  it("reads the frontmatter Ferromark declares for the route", () => {
    const result = transformMarkdownMeta(
      'const _ardoFrontmatter = {\n\t"title": "Getting Started",\n\t"description": "Set up"\n};\nexport { _ardoFrontmatter as frontmatter };\n',
      `${routesDir}/guide/getting-started.mdx`,
      { routesDir, resolvedConfig: config }
    )

    expect(result?.code).toContain('export const meta = () => [{ title: "Getting Started | Docs" }')
  })

  it("still adds meta when a code sample shows a meta export", () => {
    const code = compileRoute('```tsx\nexport const meta = () => [{ title: "Custom" }]\n```\n')

    expect(metaOf(code)?.code).toContain('{ title: "Upgrade | Docs" }')
  })

  it("leaves a page alone that exports its own meta", () => {
    const code = compileRoute('export const meta = () => [{ title: "Custom" }]\n\n# Upgrade\n')

    expect(metaOf(code)).toBeUndefined()
  })
})

// The JSON-LD descriptor is the last entry of the generated `meta` array.
function jsonLdOf(code: string | undefined): unknown {
  const match = /\{ "script:ld\+json": (\{.*\}) \}/u.exec(code ?? "")
  return match == null ? undefined : JSON.parse(match[1])
}

function metaWith(
  resolved: ResolvedConfig,
  file = "guide/upgrade.mdx",
  frontmatter = 'title: "Upgrade"'
) {
  return transformMarkdownMeta(
    `export const frontmatter = { ${frontmatter} }\n`,
    `${routesDir}/${file}`,
    { routesDir, resolvedConfig: resolved }
  )
}

describe("JSON-LD structured data", () => {
  it("describes the page as a TechArticle with absolute URLs when siteUrl is set", () => {
    const result = metaWith(config, "guide/upgrade.mdx", 'title: "Upgrade", description: "Move on"')

    expect(jsonLdOf(result?.code)).toStrictEqual({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "Upgrade",
      description: "Move on",
      url: "https://example.com/docs/guide/upgrade",
      image: "https://example.com/docs/social.png",
      isPartOf: {
        "@type": "WebSite",
        name: "Docs",
        url: "https://example.com/docs/",
      },
    })
  })

  it("names the route locale in inLanguage when the project has locales", () => {
    const localized = resolveConfig(
      {
        title: "Docs",
        siteUrl: "https://example.com",
        i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
      },
      "/site"
    )
    const result = metaWith(localized, "de/guide/upgrade.mdx")

    expect(jsonLdOf(result?.code)).toMatchObject({
      inLanguage: "de",
      url: "https://example.com/de/guide/upgrade",
    })
  })

  it("omits empty fields", () => {
    const minimal = resolveConfig({ title: "Docs", siteUrl: "https://example.com" }, "/site")

    expect(jsonLdOf(metaWith(minimal)?.code)).toStrictEqual({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "Upgrade",
      url: "https://example.com/guide/upgrade",
      isPartOf: {
        "@type": "WebSite",
        name: "Docs",
        url: "https://example.com/",
      },
    })
  })

  it("is absent without siteUrl because its URLs must be absolute", () => {
    const relative = resolveConfig({ title: "Docs", metadata: { image: "/social.png" } }, "/site")
    const code = metaWith(relative)?.code

    expect(code).toContain('{ title: "Upgrade | Docs" }')
    expect(code).not.toContain("script:ld+json")
  })

  it("is absent when seo.jsonLd is false", () => {
    const disabled = resolveConfig(
      { title: "Docs", siteUrl: "https://example.com", seo: { jsonLd: false } },
      "/site"
    )
    const code = metaWith(disabled)?.code

    expect(code).toContain('{ title: "Upgrade | Docs" }')
    expect(code).not.toContain("script:ld+json")
  })
})
