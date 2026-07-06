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
        id: path.join("v1.md", "changelog.md"),
        path: "/v1.md/changelog",
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
\`\`\`
`
    )

    const docs = await generateSearchIndex(routesDir)

    expect(docs).toStrictEqual([
      {
        id: "guide/getting-started.mdx",
        title: "Getting Started",
        content: "Getting Started Install Ardo from npm.",
        path: "/guide/getting-started",
        section: "Guide",
      },
    ])
  })

  it("limits indexed content length", async () => {
    await writeRoute("long.md", `# Long\n\n${"word ".repeat(600)}`)

    const [doc] = await generateSearchIndex(routesDir)

    expect(doc).toBeDefined()
    expect(doc.content.length).toBeLessThanOrEqual(2000)
  })
})

async function writeRoute(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(routesDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}
