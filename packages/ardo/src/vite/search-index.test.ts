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
        id: "guide/getting-started.mdx#getting-started",
        title: "Getting Started",
        pageTitle: "Getting Started",
        content: "Getting Started Install Ardo from npm.",
        excerpt: "Install Ardo from npm.",
        path: "/guide/getting-started#getting-started",
        publicPath: "/guide/getting-started#getting-started",
        routePath: "/guide/getting-started",
        anchor: "getting-started",
        headingHierarchy: ["Getting Started"],
        routeGroup: "Guide",
        section: "Guide",
      },
    ])
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
