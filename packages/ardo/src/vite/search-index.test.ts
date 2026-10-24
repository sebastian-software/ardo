import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { generateSearchIndex } from "./search-index"

let routesDir: string

beforeEach(async () => {
  routesDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-search-"))
})

afterEach(async () => {
  await fs.rm(routesDir, { force: true, recursive: true })
})

describe("generateSearchIndex", () => {
  it("indexes authored MDX text without exports, JSX tags, or props", async () => {
    await writeRoute(
      "rendering.mdx",
      [
        "---",
        "title: Rendering guide",
        "---",
        "",
        'export const handle = { layout: "bare", chrome: false };',
        "",
        '<section data-note="internal-prop">',
        "",
        "For untrusted Markdown, enable sanitize.",
        "",
        "</section>",
      ].join("\n")
    )
    const [doc] = await generateSearchIndex(routesDir)
    expect(doc?.excerpt).toBe("For untrusted Markdown, enable sanitize.")
    expect(doc?.content).toBe("Rendering guide For untrusted Markdown, enable sanitize.")
  })

  it("keeps section anchors and hierarchy across multiline MDX wrappers", async () => {
    await writeRoute(
      "rendering.mdx",
      [
        "---",
        "title: Rendering guide",
        "---",
        "",
        "import {",
        "  Section,",
        '} from "./not-evaluated"',
        "",
        'export const handle = { layout: "bare", chrome: false };',
        "",
        "# Rendering guide",
        "",
        "<Section",
        '  id="internal-prop"',
        '  label="Internal label"',
        '  intro={"Runtime-only description"}',
        ">",
        "",
        "日本語 introduction.",
        "",
        "## Install",
        "",
        "For untrusted Markdown, enable `sanitize_input`.",
        "",
        "````mdx",
        "```tsx",
        '<Demo secret="not-indexed" />',
        "```",
        "````",
        "",
        "### Safety",
        "",
        "Use [safe defaults](/guide/defaults).",
        "",
        "## Install",
        "",
        "Second section.",
        "",
        "</Section>",
      ].join("\n")
    )
    const records = await generateSearchIndex(routesDir, {
      basePath: "/project/v6/",
      localeId: "de",
      versionId: "v6",
      markdown: { headingOffset: 1, headingIdPrefix: "page-" },
    })
    expect(
      records.map(({ title, excerpt, publicPath, headingHierarchy }) => ({
        title,
        excerpt,
        publicPath,
        headingHierarchy,
      }))
    ).toStrictEqual([
      {
        title: "Rendering guide",
        excerpt: "日本語 introduction.",
        publicPath: "/project/v6/de/rendering",
        headingHierarchy: ["Rendering guide"],
      },
      {
        title: "Install",
        excerpt: "For untrusted Markdown, enable sanitize_input.",
        publicPath: "/project/v6/de/rendering#page-install",
        headingHierarchy: ["Install"],
      },
      {
        title: "Safety",
        excerpt: "Use safe defaults.",
        publicPath: "/project/v6/de/rendering#page-safety",
        headingHierarchy: ["Install", "Safety"],
      },
      {
        title: "Install",
        excerpt: "Second section.",
        publicPath: "/project/v6/de/rendering#page-install-1",
        headingHierarchy: ["Install"],
      },
    ])
  })

  it("keeps literal export prose in Markdown and readable headings without anchors", async () => {
    await writeRoute(
      "export.md",
      "export a value and import a helper.\n\n## Example\n\nKeep `source_name`.\n"
    )
    const records = await generateSearchIndex(routesDir, { markdown: { anchor: false } })
    expect(records).toHaveLength(1)
    expect(records[0].excerpt).toBe("export a value and import a helper. Example Keep source_name.")
    expect(records[0].anchor).toBeUndefined()
  })

  it("only strips markdown extensions from the end of search paths", async () => {
    await writeRoute("v1.md/changelog.md", "---\ntitle: Changelog\n---\nBody")

    expect(await generateSearchIndex(routesDir)).toContainEqual(
      expect.objectContaining({
        id: `${path.join("v1.md", "changelog.md")}#page-0`,
        path: "/v1.md/changelog",
        publicPath: "/v1.md/changelog",
        routePath: "/v1.md/changelog",
      })
    )
  })

  it("builds sectioned docs from markdown and removes non-searchable syntax", async () => {
    await writeRoute(
      "guide/getting-started.mdx",
      `---
title: Getting Started
---
import { Demo } from "./Demo"

# Getting Started

Install **Ardo** from npm.

\`\`\`ts
const secret = "do not index code"
# Not A Heading
\`\`\`

~~~md
## Also Not A Heading
### Still Not A Heading
~~~
\`\`\`ts
const moreSecret = "also do not index"
\`\`\`
`
    )

    const docs = await generateSearchIndex(routesDir)

    expect(docs).toStrictEqual([
      {
        id: "guide/getting-started.mdx#page-0",
        title: "Getting Started",
        pageTitle: "Getting Started",
        content: "Getting Started Install Ardo from npm.",
        excerpt: "Install Ardo from npm.",
        path: "/guide/getting-started",
        publicPath: "/guide/getting-started",
        routePath: "/guide/getting-started",
        headingHierarchy: ["Getting Started"],
        routeGroup: "Guide",
        section: "Guide",
      },
    ])
  })

  it("keeps table cells but not the delimiter row in search text", async () => {
    await writeRoute(
      "guide/options.md",
      "---\ntitle: Options\n---\n\n| Name | Required |\n| --- | :---: |\n| config | Yes |\n"
    )

    const [doc] = await generateSearchIndex(routesDir)

    expect(doc?.excerpt).toBe("Name Required config Yes")
  })

  it("indexes native setext and JSX heading text using the rendered heading ranges", async () => {
    await writeRoute(
      "guide/native.mdx",
      [
        "---",
        "title: Native",
        "---",
        "",
        "# Native",
        "",
        "日本語 introduction.",
        "",
        "What's included?",
        "----------------",
        "",
        "First section.",
        "",
        "## <Badge>What's included?</Badge>",
        "",
        "Second section.",
      ].join("\n")
    )
    const records = await generateSearchIndex(routesDir)
    expect(records.map(({ anchor }) => anchor)).toStrictEqual([
      undefined,
      "what-s-included",
      "what-s-included-1",
    ])
    expect(records[0].excerpt).toBe("日本語 introduction.")
    expect(records[1].excerpt).toBe("First section.")
    expect(records[2].excerpt).toBe("Second section.")
    expect(records[2].title).toBe("What's included?")
  })

  it("builds one static record per markdown section with heading hierarchy", async () => {
    await writeRoute(
      "guide/configuration.mdx",
      `---
title: Configuration
---

# Configure Ardo

Choose defaults.

## GitHub Pages

Deploy static files.

## GitHub Pages

Keep redirects.
`
    )

    const docs = await generateSearchIndex(routesDir, {
      basePath: "/v3/",
      localeId: "en",
      versionId: "v3",
    })

    expect(docs).toStrictEqual([
      expect.objectContaining({
        id: "guide/configuration.mdx#configure-ardo",
        title: "Configure Ardo",
        pageTitle: "Configuration",
        anchor: "configure-ardo",
        headingHierarchy: ["Configure Ardo"],
        path: "/guide/configuration#configure-ardo",
        publicPath: "/v3/en/guide/configuration#configure-ardo",
        routeGroup: "Guide",
        localeId: "en",
        versionId: "v3",
      }),
      expect.objectContaining({
        id: "guide/configuration.mdx#github-pages",
        title: "GitHub Pages",
        headingHierarchy: ["Configure Ardo", "GitHub Pages"],
        path: "/guide/configuration#github-pages",
        publicPath: "/v3/en/guide/configuration#github-pages",
      }),
      expect.objectContaining({
        id: "guide/configuration.mdx#github-pages-1",
        title: "GitHub Pages",
        headingHierarchy: ["Configure Ardo", "GitHub Pages"],
        path: "/guide/configuration#github-pages-1",
        publicPath: "/v3/en/guide/configuration#github-pages-1",
      }),
    ])
  })

  it("adds route identity metadata without changing runtime navigation paths", async () => {
    await writeRoute("guide/getting-started.mdx", "---\ntitle: Getting Started\n---\nBody")

    const docs = await generateSearchIndex(routesDir, {
      basePath: "/v3/",
      localeId: "en",
      versionId: "v3",
    })

    expect(docs).toStrictEqual([
      expect.objectContaining({
        localeId: "en",
        path: "/guide/getting-started",
        publicPath: "/v3/en/guide/getting-started",
        routePath: "/guide/getting-started",
        versionId: "v3",
      }),
    ])
  })

  it("limits indexed content length", async () => {
    await writeRoute("long.md", `# Long\n\n${"word ".repeat(600)}`)

    const [doc] = await generateSearchIndex(routesDir)

    expect(doc).toBeDefined()
    expect(doc.excerpt.length).toBeLessThanOrEqual(2000)
  })
})

async function writeRoute(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(routesDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}
