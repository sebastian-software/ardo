import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resolveConfig } from "../config"
import { transformMarkdown } from "../markdown/pipeline"
import { createShikiHighlighter } from "../markdown/shiki"
import { getSlugFromPath, loadAllDocs, loadDoc } from "./loader"

vi.mock("../markdown/pipeline", () => ({
  transformMarkdown: vi.fn(async () => {
    await Promise.resolve()
    return {
      content: "",
      frontmatter: { title: "Loaded" },
      html: "<p>Loaded</p>",
      toc: [],
    }
  }),
}))

vi.mock("../markdown/shiki", () => ({
  createShikiHighlighter: vi.fn(async () => {
    await Promise.resolve()
    return { highlighter: true }
  }),
}))

const mockedCreateShikiHighlighter = vi.mocked(createShikiHighlighter)
const mockedTransformMarkdown = vi.mocked(transformMarkdown)

let contentDir: string

beforeEach(async () => {
  contentDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-loader-"))
  mockedCreateShikiHighlighter.mockClear()
  mockedTransformMarkdown.mockClear()
})

afterEach(async () => {
  await fs.rm(contentDir, { force: true, recursive: true })
})

describe("runtime loader", () => {
  it("loads mdx documents by slug", async () => {
    await writeContent("guide/intro.mdx", "# Intro")
    const config = resolveConfig({ title: "Docs" }, contentDir)

    const doc = await loadDoc({ config, contentDir, slug: "guide/intro" })

    expect(doc?.relativePath).toBe(path.join("guide", "intro.mdx"))
    expect(doc?.frontmatter.title).toBe("Loaded")
  })

  it("loads all markdown documents with one shared highlighter", async () => {
    await writeContent("guide/intro.mdx", "# Intro")
    await writeContent("guide/usage.md", "# Usage")
    const config = resolveConfig({ title: "Docs" }, contentDir)

    const docs = await loadAllDocs(contentDir, config)

    expect(docs.map((doc) => doc.relativePath).sort()).toStrictEqual([
      path.join("guide", "intro.mdx"),
      path.join("guide", "usage.md"),
    ])
    expect(mockedCreateShikiHighlighter).toHaveBeenCalledTimes(1)
    expect(mockedTransformMarkdown).toHaveBeenCalledTimes(2)
  })

  it("derives slugs from md and mdx paths without touching directory names", () => {
    expect(getSlugFromPath(path.join("v1.md", "changelog.md"))).toBe("v1.md/changelog")
    expect(getSlugFromPath(path.join("guide", "intro.mdx"))).toBe("guide/intro")
  })
})

async function writeContent(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(contentDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}
