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

describe("llms-text", () => {
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
    expect(text).toContain("- [Guide](https://example.com/docs/guide): Start here")
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
        "- [What is Ardo?](https://example.com/docs/guide/what-is-ardo)",
        "- [Agent Instructions](https://example.com/docs/guide/agent)",
        "- [Releases](https://example.com/docs/guide/releases)",
        "- [Upgrade to v6](https://example.com/docs/guide/releases/v6)",
        "- [Troubleshooting](https://example.com/docs/guide/troubleshooting)",
        "",
        "## API",
        "",
        "- [API Reference](https://example.com/docs/api-reference): Index of 2 generated reference pages.",
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
      "## API\n\n- [ArdoCard](https://example.com/docs/api-reference/components/ardocard)\n"
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
})
