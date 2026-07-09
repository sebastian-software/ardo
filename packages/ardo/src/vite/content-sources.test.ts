import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { materializeContentSources } from "./content-sources"
import { scanRouteManifest } from "./route-manifest"

let rootDir: string
let routesDir: string

beforeEach(async () => {
  rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-content-sources-"))
  routesDir = path.join(rootDir, "app", "routes")
  await fs.mkdir(routesDir, { recursive: true })
})

afterEach(async () => {
  await fs.rm(rootDir, { force: true, recursive: true })
})

describe("content source mapping", () => {
  it("materializes external markdown into generated route files with default metadata", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {
      // Suppress expected generation output in this test.
    })
    await writeSource(
      "adr/0001-use-github-pages.md",
      `# Use GitHub Pages

Keep ADRs next to the code.
`
    )

    await materializeContentSources({
      root: rootDir,
      routesDir,
      sources: [{ from: "adr", to: "decisions" }],
    })

    const generated = await fs.readFile(
      path.join(routesDir, "decisions", "0001-use-github-pages.md"),
      "utf8"
    )
    expect(generated).toContain('title: "Use GitHub Pages"')
    expect(generated).toContain("order: 1")

    const entries = await scanRouteManifest(routesDir)
    expect(entries).toContainEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          order: 1,
          publicPath: "/decisions/0001-use-github-pages",
          routePath: "/decisions/0001-use-github-pages",
          sourcePath: "decisions/0001-use-github-pages.md",
          title: "Use GitHub Pages",
        }),
      })
    )
    log.mockRestore()
  })

  it("preserves existing frontmatter and lets source hooks override metadata", async () => {
    await writeSource(
      "root/CHANGELOG.md",
      `---
title: Changelog
---

# Releases
`
    )

    await materializeContentSources({
      root: rootDir,
      routesDir,
      sources: [
        {
          from: "root/CHANGELOG.md",
          to: "changelog",
          frontmatter: (file) => ({
            description: `Copied from ${file.relativePath}`,
            order: 10,
          }),
        },
      ],
    })

    const generated = await fs.readFile(path.join(routesDir, "changelog", "index.md"), "utf8")
    expect(generated).toContain('title: "Changelog"')
    expect(generated).toContain('description: "Copied from CHANGELOG.md"')
    expect(generated).toContain("order: 10")
  })

  it("refuses to replace handwritten target directories", async () => {
    await writeSource("adr/0001-safe.md", "# Safe\n")
    await fs.mkdir(path.join(routesDir, "decisions"), { recursive: true })
    await fs.writeFile(path.join(routesDir, "decisions", "index.md"), "# Handwritten\n")

    await expect(
      materializeContentSources({
        root: rootDir,
        routesDir,
        sources: [{ from: "adr", to: "decisions" }],
      })
    ).rejects.toThrow("Refusing to delete")
  })
})

async function writeSource(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(rootDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}
