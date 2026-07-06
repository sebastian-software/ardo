import fs from "node:fs/promises"
import path from "node:path"

import type { PageData, PageFrontmatter, ResolvedConfig, TOCItem } from "../config/types"

import { transformMarkdown, type TransformOptions } from "../markdown/pipeline"
import { createShikiHighlighter } from "../markdown/shiki"
import { stripTrailingExtension } from "../vite/path-utils"

export type LoadDocOptions = {
  slug: string
  contentDir: string
  config: ResolvedConfig
}

export type LoadDocResult = {
  content: string
  frontmatter: PageFrontmatter
  toc: TOCItem[]
  filePath: string
  relativePath: string
  lastUpdated?: number
}

async function findFile(
  contentDir: string,
  slug: string
): Promise<{ filePath: string; fileContent: string } | null> {
  const possiblePaths = [
    path.join(contentDir, `${slug}.mdx`),
    path.join(contentDir, `${slug}.md`),
    path.join(contentDir, slug, "index.mdx"),
    path.join(contentDir, slug, "index.md"),
  ]

  for (const tryPath of possiblePaths) {
    try {
      const fileContent = await fs.readFile(tryPath, "utf8")
      return { filePath: tryPath, fileContent }
    } catch {
      continue
    }
  }
  return null
}

async function getLastUpdated(filePath: string): Promise<number | undefined> {
  try {
    const stat = await fs.stat(filePath)
    return stat.mtimeMs
  } catch {
    return undefined
  }
}

export async function loadDoc(options: LoadDocOptions): Promise<LoadDocResult | null> {
  const { slug, contentDir, config } = options
  const found = await findFile(contentDir, slug)
  if (found === null) return null

  const result = await transformMarkdown(found.fileContent, config.markdown)
  return {
    content: result.html,
    frontmatter: result.frontmatter,
    toc: result.toc,
    filePath: found.filePath,
    relativePath: path.relative(contentDir, found.filePath),
    lastUpdated: await getLastUpdated(found.filePath),
  }
}

export async function loadAllDocs(contentDir: string, config: ResolvedConfig): Promise<PageData[]> {
  const docs: PageData[] = []
  const highlighter = await createShikiHighlighter(config.markdown)
  const transformOptions: TransformOptions = { highlighter }

  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await scanDir(fullPath)
      } else if (isMarkdownFile(entry.name)) {
        const pageData = await createPageDataFromFile({
          config,
          contentDir,
          entryName: entry.name,
          filePath: fullPath,
          transformOptions,
        })
        docs.push(pageData)
      }
    }
  }

  await scanDir(contentDir)
  return docs
}

async function createPageDataFromFile(params: {
  config: ResolvedConfig
  contentDir: string
  entryName: string
  filePath: string
  transformOptions: TransformOptions
}): Promise<PageData> {
  const extension = getMarkdownExtension(params.entryName) ?? ".md"
  const fileContent = await fs.readFile(params.filePath, "utf8")
  const result = await transformMarkdown(
    fileContent,
    params.config.markdown,
    params.transformOptions
  )
  const relativePath = path.relative(params.contentDir, params.filePath)

  return {
    title:
      result.frontmatter.title ?? formatTitle(stripTrailingExtension(params.entryName, extension)),
    description: result.frontmatter.description,
    frontmatter: result.frontmatter,
    content: result.html,
    toc: result.toc,
    filePath: params.filePath,
    relativePath,
    lastUpdated: await getLastUpdated(params.filePath),
  }
}

function formatTitle(name: string): string {
  return name.replaceAll(/[_-]/g, " ").replaceAll(/\b\w/g, (c) => c.toUpperCase())
}

export function getSlugFromPath(relativePath: string): string {
  const extension = getMarkdownExtension(relativePath)
  const withoutExtension =
    extension == null ? relativePath : stripTrailingExtension(relativePath, extension)
  return withoutExtension.replace(/\/index$/, "").replaceAll("\\", "/")
}

export function getPageDataForRoute(docs: PageData[], slug: string): PageData | undefined {
  return docs.find((doc) => {
    const docSlug = getSlugFromPath(doc.relativePath)
    return docSlug === slug || docSlug === `${slug}/index`
  })
}

function isMarkdownFile(fileName: string): boolean {
  return getMarkdownExtension(fileName) != null
}

function getMarkdownExtension(fileName: string): ".md" | ".mdx" | null {
  if (fileName.endsWith(".mdx")) {
    return ".mdx"
  }

  if (fileName.endsWith(".md")) {
    return ".md"
  }

  return null
}
