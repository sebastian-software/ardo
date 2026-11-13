import fs from "node:fs/promises"
import { describe, expect, it } from "vitest"

import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { resolveConfig } from "../config"
import { toPageMarkdownPath } from "./llms-pages"
import { createLlmsTextAssets, generateLlmsFullTxt, generateLlmsTxt } from "./llms-text"
import { createPageMetadata } from "./page-metadata"
import { createCurrentRouteIdentity } from "./route-identity"

const config: ResolvedConfig = {
  base: "/docs/",
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

function entry({
  sourcePath,
  ...overrides
}: Partial<RouteManifestEntry> & { sourcePath?: string }): RouteManifestEntry {
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
    metadata: createPageMetadata({
      frontmatter,
      identity,
      sourcePath: sourcePath ?? `${routePath.slice(1) || "index"}.mdx`,
    }),
    path: identity.routePath,
    publicPath: identity.publicPath,
    routePath: identity.routePath,
    source: "markdown",
    ...overrides,
  }
}

function siteConfig(trailingSlash: boolean | undefined, extra = {}) {
  return resolveConfig(
    { title: "Docs", base: "/docs/", siteUrl: "https://example.com", trailingSlash, ...extra },
    "/tmp"
  )
}

function sources(assets: Array<{ fileName: string; source: string }>) {
  return Object.fromEntries(assets.map((asset) => [asset.fileName, asset.source]))
}

describe("llms-text", () => {
  it.each(["", "https://example.com"])(
    "projects JSX-wrapped links before resolving them with siteUrl=%j",
    (siteUrl) => {
      const text = generateLlmsFullTxt(
        [
          entry({
            content: [
              'export const handle = { layout: "bare", chrome: false };',
              "",
              "<section>",
              "",
              '[**Start**](/guide/start "Start here") and [reference][start].',
              "",
              "`[example](/guide/start)`",
              "",
              "```md",
              "[example](/guide/start)",
              "```",
              "",
              "</section>",
              "",
              "[start]: /guide/start",
            ].join("\n"),
          }),
          entry({ routePath: "/guide/start" }),
        ],
        { ...config, siteUrl }
      )
      expect(text).toContain(`[**Start**](<${siteUrl}/docs/guide/start/> "Start here")`)
      expect(text).toContain(`[reference](<${siteUrl}/docs/guide/start/>)`)
      expect(text).toContain("`[example](/guide/start)`")
      expect(text).toContain("```md\n[example](/guide/start)\n```")
      expect(text).not.toContain("<section>")
      expect(text).not.toContain("export const handle")
    }
  )

  it("keeps local deployment, version, and locale paths through JSX projection", () => {
    const localized = resolveConfig(
      {
        title: "Docs",
        base: "/project/",
        versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] },
        i18n: { defaultLocale: "de", locales: [{ id: "de" }] },
      },
      "/tmp"
    )
    const page = entry({
      routePath: "/guide/setup",
      publicPath: "/project/v6/de/guide/setup",
      content: "<section>\n\n## Details\n\n[next](/guide/next) [here](#details)\n\n</section>",
    })
    const full = createLlmsTextAssets([page], localized).filter((asset) =>
      asset.fileName.endsWith("llms-full.txt")
    )
    expect(full).toHaveLength(2)
    for (const asset of full) {
      expect(asset.source).toContain("[next](</project/v6/de/guide/next/>)")
      expect(asset.source).toContain("[here](</project/v6/de/guide/setup#details>)")
      expect(asset.source).toContain("### Details")
    }
  })

  it("passes the full route set to links in exported Markdown", () => {
    const text = generateLlmsFullTxt(
      [
        entry({ content: "[release](/guide/release-6.0) [manual](/manual.pdf)" }),
        entry({ routePath: "/guide/release-6.0" }),
      ],
      config
    )
    expect(text).toContain("[release](<https://example.com/docs/guide/release-6.0/>)")
    expect(text).toContain("[manual](<https://example.com/docs/manual.pdf>)")
  })

  it("generates an index with absolute links and excludes opted-out pages", () => {
    const text = generateLlmsTxt(
      [
        entry({ frontmatter: { title: "Guide", description: "Start here" }, routePath: "/guide" }),
        entry({ frontmatter: { llms: false, title: "Private" }, routePath: "/private" }),
      ],
      config
    )

    expect(text).toContain("# Ardo")
    expect(text).toContain("- [Guide](https://example.com/docs/guide.md): Start here")
    expect(text).not.toContain("Private")
  })

  it("follows the sidebar, one section per tab, with the API reference as one link", () => {
    const pages = [
      entry({
        frontmatter: { title: "API Reference" },
        routePath: "/api-reference",
        sourcePath: "api-reference/index.md",
      }),
      entry({
        frontmatter: { title: "ArdoCard" },
        routePath: "/api-reference/components/ardocard",
        sourcePath: "api-reference/components/ardocard.md",
      }),
      entry({
        frontmatter: { title: "useArdoPage" },
        routePath: "/api-reference/functions/useardopage",
        sourcePath: "api-reference/functions/useardopage.md",
      }),
      entry({ frontmatter: { title: "Troubleshooting" }, routePath: "/guide/troubleshooting" }),
      entry({ frontmatter: { title: "Releases", order: 20 }, routePath: "/guide/releases" }),
      entry({ frontmatter: { title: "Upgrade to v6" }, routePath: "/guide/releases/v6" }),
      entry({ frontmatter: { title: "Agent Instructions", order: 3 }, routePath: "/guide/agent" }),
      entry({
        frontmatter: { title: "What is Ardo?", order: 1 },
        routePath: "/guide/what-is-ardo",
      }),
    ]

    expect(generateLlmsTxt(pages, config, { referenceDirs: ["./api-reference/"] })).toBe(
      [
        "# Ardo",
        "",
        "> Framework docs",
        "",
        "## Guide",
        "",
        "- [What is Ardo?](https://example.com/docs/guide/what-is-ardo.md)",
        "- [Agent Instructions](https://example.com/docs/guide/agent.md)",
        "- [Releases](https://example.com/docs/guide/releases.md)",
        "- [Upgrade to v6](https://example.com/docs/guide/releases/v6.md)",
        "- [Troubleshooting](https://example.com/docs/guide/troubleshooting.md)",
        "",
        "## API",
        "",
        "- [API Reference](https://example.com/docs/api-reference.md): Index of 2 generated reference pages.",
        "",
        "## More",
        "",
        "- [Full documentation](https://example.com/docs/llms-full.txt): Complete documentation as one Markdown file.",
        "",
      ].join("\n")
    )

    const full = generateLlmsFullTxt(pages, config)
    const sections = [...full.matchAll(/^## (.+)$/gmu)].map((match) => match[1])
    expect(sections).toStrictEqual([
      "What is Ardo?",
      "Agent Instructions",
      "Releases",
      "Upgrade to v6",
      "Troubleshooting",
      "API Reference",
      "ArdoCard",
      "useArdoPage",
    ])
  })

  it("nests a page's own headings below its title in full text", () => {
    const text = generateLlmsFullTxt(
      [
        entry({
          content: "# Guide\n\n## Install\n\n```md\n## Example\n```\n",
          frontmatter: { title: "Guide" },
          routePath: "/guide",
        }),
      ],
      config
    )
    expect(text).toContain("## Guide\n")
    expect(text).toContain("\n### Install\n")
    expect(text).toContain("```md\n## Example\n```")
  })

  it("lists every reference page when the reference folder has no index", () => {
    const text = generateLlmsTxt(
      [
        entry({
          frontmatter: { title: "ArdoCard" },
          routePath: "/api-reference/components/ardocard",
          sourcePath: "api-reference/components/ardocard.md",
        }),
      ],
      config,
      { referenceDirs: ["api-reference"] }
    )
    expect(text).toContain(
      "## API\n\n- [ArdoCard](https://example.com/docs/api-reference/components/ardocard.md)\n"
    )
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
      new URL("../../../../docs/app/content/guide/getting-started.mdx", import.meta.url),
      "utf8"
    )
    const versionedConfig = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        siteUrl: "https://example.com",
        i18n: { defaultLocale: "en", locales: [{ id: "en" }] },
        versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] },
      },
      "/tmp"
    )
    const page = entry({
      content: source,
      publicPath: "/docs/v6/en/guide/getting-started",
      routePath: "/guide/getting-started",
      frontmatter: { title: "Getting Started" },
    })
    const full = createLlmsTextAssets([page], versionedConfig).filter((asset) =>
      asset.fileName.endsWith("llms-full.txt")
    )
    expect(full).toHaveLength(2)
    for (const asset of full) {
      expect(asset.source).toContain(
        "[tested Basic example](<https://example.com/docs/v6/en/guide/agent-instructions/#the-basic-example>)"
      )
      expect(asset.source).toContain(
        "[manual installation](<https://example.com/docs/v6/en/guide/getting-started#manual-installation>)"
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

  it("reads Markdown pages as Markdown, where a line may start with export", () => {
    const page = entry({
      content:
        "# Errors\n\nThe default boundary is fine;\nexport a different one from `root.tsx`.\n",
      filePath: "/tmp/errors.md",
      frontmatter: { title: "Errors" },
    })
    const full = createLlmsTextAssets([page], resolveConfig({ title: "Docs" }, "/tmp")).find(
      (asset) => asset.fileName === "llms-full.txt"
    )

    expect(full?.source).toContain("export a different one from `root.tsx`.")
  })

  it("names a page's Markdown after its URL, with index.md for a directory root", () => {
    expect(toPageMarkdownPath("/docs/guide/start")).toBe("/docs/guide/start.md")
    expect(toPageMarkdownPath("/docs/")).toBe("/docs/index.md")
    expect(toPageMarkdownPath("/docs/v6/de/")).toBe("/docs/v6/de/index.md")
  })

  it("writes one Markdown file per opted-in page, with index.md for the root", () => {
    const pages = [
      entry({ frontmatter: { title: "Home" }, routePath: "/" }),
      entry({ frontmatter: { title: "Start" }, routePath: "/guide/start" }),
      entry({ frontmatter: { llms: false, title: "Private" }, routePath: "/private" }),
    ]

    expect(createLlmsTextAssets(pages, config).map((asset) => asset.fileName)).toStrictEqual([
      "llms.txt",
      "llms-full.txt",
      "index.md",
      "guide/start.md",
    ])
  })

  it("leaves pages with route parameters out of every llms output", () => {
    const pages = [
      entry({ frontmatter: { title: "Start" }, routePath: "/guide/start" }),
      entry({ frontmatter: { title: "Slug" }, routePath: "/guide/:slug" }),
    ]

    const assets = createLlmsTextAssets(pages, config)
    expect(assets.map((asset) => asset.fileName)).toStrictEqual([
      "llms.txt",
      "llms-full.txt",
      "guide/start.md",
    ])
    for (const asset of assets) expect(asset.source).not.toContain(":slug")
  })

  it("keeps versioned and localized page files under their URL folders, once each", () => {
    const localized = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        siteUrl: "https://example.com",
        i18n: { defaultLocale: "en", locales: [{ id: "en" }] },
        versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] },
      },
      "/tmp"
    )
    const assets = createLlmsTextAssets(
      [
        entry({
          frontmatter: { title: "Home" },
          publicPath: "/docs/v6/en/",
          routePath: "/",
        }),
        entry({
          frontmatter: { title: "Start" },
          publicPath: "/docs/v6/en/guide/start",
          routePath: "/guide/start",
        }),
      ],
      localized
    )

    expect(assets.map((asset) => asset.fileName)).toStrictEqual([
      "llms.txt",
      "llms-full.txt",
      "v6/en/index.md",
      "v6/en/guide/start.md",
      "v6/llms.txt",
      "v6/llms-full.txt",
    ])
    expect(assets.find((asset) => asset.fileName === "v6/llms.txt")?.source).toContain(
      "- [Start](https://example.com/docs/v6/en/guide/start.md)"
    )
  })

  it("writes page files with the title as #, the full-text body, and unshifted headings", () => {
    const start = entry({
      content: "# Start\n\n## Install\n\n[Next](/guide/next)\n\nKeep this.\n",
      frontmatter: { description: "Begin here", title: "Start" },
      routePath: "/guide/start",
    })
    const assets = createLlmsTextAssets([start, entry({ routePath: "/guide/next" })], config)
    const page = assets.find((asset) => asset.fileName === "guide/start.md")?.source
    const full = assets.find((asset) => asset.fileName === "llms-full.txt")?.source

    expect(page).toBe(
      [
        "# Start",
        "",
        "Begin here",
        "",
        "Source: https://example.com/docs/guide/start",
        "",
        "## Install",
        "",
        "[Next](<https://example.com/docs/guide/next/>)",
        "",
        "Keep this.",
        "",
      ].join("\n")
    )
    expect(full).toContain("\n### Install\n")
    expect(full).toContain("[Next](<https://example.com/docs/guide/next/>)\n\nKeep this.")
  })

  it("links reference index pages to Markdown, and gives every reference page a file", () => {
    const pages = [
      entry({
        frontmatter: { title: "API Reference" },
        routePath: "/api-reference",
        sourcePath: "api-reference/index.md",
      }),
      entry({
        frontmatter: { title: "ArdoCard" },
        routePath: "/api-reference/components/ardocard",
        sourcePath: "api-reference/components/ardocard.md",
      }),
    ]
    const assets = createLlmsTextAssets(pages, config, { referenceDirs: ["api-reference"] })
    const markdown = assets
      .map((asset) => asset.fileName)
      .filter((fileName) => fileName.endsWith(".md"))
      .sort()
    const index = assets.find((asset) => asset.fileName === "llms.txt")?.source

    expect(markdown).toStrictEqual(["api-reference.md", "api-reference/components/ardocard.md"])
    expect(index).toContain("- [API Reference](https://example.com/docs/api-reference.md)")
    expect(index).not.toContain("ardocard")
  })

  it("links HTML pages and writes no page files when seo.llms.pages is false", () => {
    const pagesOff = { ...config, seo: { ...config.seo, llms: { pages: false } } }
    const assets = createLlmsTextAssets(
      [entry({ frontmatter: { title: "Start" }, routePath: "/guide/start" })],
      pagesOff
    )

    expect(assets.map((asset) => asset.fileName)).toStrictEqual(["llms.txt", "llms-full.txt"])
    expect(assets.find((asset) => asset.fileName === "llms.txt")?.source).toContain(
      "- [Start](https://example.com/docs/guide/start)"
    )
  })

  it("collapses blank-line runs between blocks but keeps blank lines inside code fences", () => {
    const page = entry({
      content:
        "First paragraph.\n\n\n\nSecond paragraph.\n\n```txt\nalpha\n\n\nomega\n```\n\n\n\nLast.\n",
      frontmatter: { title: "Blank Lines" },
      routePath: "/guide/blank-lines",
    })
    const assets = createLlmsTextAssets([page], config)
    const source = assets.find((asset) => asset.fileName === "guide/blank-lines.md")?.source

    expect(source).toBe(
      [
        "# Blank Lines",
        "",
        "Source: https://example.com/docs/guide/blank-lines",
        "",
        "First paragraph.",
        "",
        "Second paragraph.",
        "",
        "```txt",
        "alpha",
        "",
        "",
        "omega",
        "```",
        "",
        "Last.",
        "",
      ].join("\n")
    )
    expect(assets.find((asset) => asset.fileName === "llms-full.txt")?.source).toContain(
      "First paragraph.\n\nSecond paragraph.\n\n```txt\nalpha\n\n\nomega\n```\n\nLast."
    )
  })

  describe("trailingSlash", () => {
    const pages = [
      entry({ frontmatter: { title: "Home" }, routePath: "/" }),
      entry({
        content: "[x](/guide/intro) [r](/) [f](/f.pdf)",
        frontmatter: { title: "Intro" },
        routePath: "/guide/intro",
      }),
      entry({ frontmatter: { title: "Other" }, routePath: "/guide/other" }),
    ]
    // Page URLs: slash for true only. Body links: slash for true and unset.
    const cases = [
      { trailingSlash: true, page: "/", body: "/" },
      { trailingSlash: false, page: "", body: "" },
      { trailingSlash: undefined, page: "", body: "/" },
    ]

    it.each(cases)(
      "spells llms.txt HTML page links per trailingSlash=$trailingSlash when pages are off",
      ({ trailingSlash, page }) => {
        const text = generateLlmsTxt(
          pages,
          siteConfig(trailingSlash, { seo: { llms: { pages: false } } })
        )
        expect(text).toContain("- [Home](https://example.com/docs/)")
        expect(text).toContain(`- [Intro](https://example.com/docs/guide/intro${page})`)
        expect(text).toContain(`- [Other](https://example.com/docs/guide/other${page})`)
      }
    )

    it.each(cases)(
      "keeps llms.txt Markdown links whatever trailingSlash=$trailingSlash is",
      ({ trailingSlash }) => {
        const text = generateLlmsTxt(pages, siteConfig(trailingSlash))
        expect(text).toContain("(https://example.com/docs/index.md)")
        expect(text).toContain("(https://example.com/docs/guide/intro.md)")
      }
    )

    it.each(cases)(
      "spells llms-full Source lines per trailingSlash=$trailingSlash",
      ({ trailingSlash, page }) => {
        const text = generateLlmsFullTxt(pages, siteConfig(trailingSlash))
        expect([...text.matchAll(/^Source: .+$/gmu)].map((match) => match[0])).toStrictEqual([
          "Source: https://example.com/docs/",
          `Source: https://example.com/docs/guide/intro${page}`,
          `Source: https://example.com/docs/guide/other${page}`,
        ])
      }
    )

    it.each(cases)(
      "keeps page file names and spells their Source lines per trailingSlash=$trailingSlash",
      ({ trailingSlash, page }) => {
        const assets = createLlmsTextAssets(pages, siteConfig(trailingSlash))
        const files = assets.filter((asset) => asset.fileName.endsWith(".md"))
        expect(files.map((asset) => asset.fileName)).toStrictEqual([
          "index.md",
          "guide/intro.md",
          "guide/other.md",
        ])
        expect(files.map((asset) => /^Source: .+$/mu.exec(asset.source)?.[0])).toStrictEqual([
          "Source: https://example.com/docs/",
          `Source: https://example.com/docs/guide/intro${page}`,
          `Source: https://example.com/docs/guide/other${page}`,
        ])
      }
    )

    it.each(cases)(
      "spells body links in full text and page files per trailingSlash=$trailingSlash",
      ({ trailingSlash, body }) => {
        const assets = createLlmsTextAssets(pages, siteConfig(trailingSlash))
        const expected = `[x](<https://example.com/docs/guide/intro${body}>) [r](<https://example.com/docs/>) [f](<https://example.com/docs/f.pdf>)`
        expect(sources(assets)["llms-full.txt"]).toContain(expected)
        expect(sources(assets)["guide/intro.md"]).toContain(expected)
      }
    )

    it.each(cases)(
      "spells versioned Source lines per trailingSlash=$trailingSlash",
      ({ trailingSlash, page }) => {
        const versioned = siteConfig(trailingSlash, {
          versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] },
        })
        const assets = createLlmsTextAssets(
          [
            entry({ frontmatter: { title: "Home" }, publicPath: "/docs/v6/", routePath: "/" }),
            entry({
              frontmatter: { title: "Intro" },
              publicPath: "/docs/v6/guide/intro",
              routePath: "/guide/intro",
            }),
          ],
          versioned
        )
        const text = sources(assets)["v6/llms-full.txt"]
        expect([...text.matchAll(/^Source: .+$/gmu)].map((match) => match[0])).toStrictEqual([
          "Source: https://example.com/docs/v6/",
          `Source: https://example.com/docs/v6/guide/intro${page}`,
        ])
        expect(sources(assets)["v6/llms.txt"]).toContain("(https://example.com/docs/v6/index.md)")
      }
    )
  })
})
