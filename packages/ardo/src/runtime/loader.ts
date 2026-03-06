import fs from "node:fs/promises"
import path from "node:path"

import type { PageData, PageFrontmatter, ResolvedConfig, TOCItem } from "../config/types"

import { transformMarkdown } from "../markdown/pipeline"

export interface LoadDocOptions {
  slug: string
  contentDir: string
  config: ResolvedConfig
}

export interface LoadDocResult {
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
    path.join(contentDir, `${slug}.md`),
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

  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await scanDir(fullPath)
      } else if (entry.name.endsWith(".md")) {
        const fileContent = await fs.readFile(fullPath, "utf8")
        const result = await transformMarkdown(fileContent, config.markdown)
        const relativePath = path.relative(contentDir, fullPath)

        let lastUpdated: number | undefined
        try {
          const stat = await fs.stat(fullPath)
          lastUpdated = stat.mtimeMs
        } catch {
          // Ignore stat errors
        }

        docs.push({
          title: result.frontmatter.title ?? formatTitle(entry.name.replace(/\.md$/, "")),
          description: result.frontmatter.description,
          frontmatter: result.frontmatter,
          content: result.html,
          toc: result.toc,
          filePath: fullPath,
          relativePath,
          lastUpdated,
        })
      }
    }
  }

  await scanDir(contentDir)
  return docs
}

function formatTitle(name: string): string {
  return name.replaceAll(/[_-]/g, " ").replaceAll(/\b\w/g, (c) => c.toUpperCase())
}

export function getSlugFromPath(relativePath: string): string {
  return relativePath
    .replace(/\.md$/, "")
    .replace(/\/index$/, "")
    .replaceAll("\\", "/")
}

export function getPageDataForRoute(docs: PageData[], slug: string): PageData | undefined {
  return docs.find((doc) => {
    const docSlug = getSlugFromPath(doc.relativePath)
    return docSlug === slug || docSlug === `${slug}/index`
  })
}
