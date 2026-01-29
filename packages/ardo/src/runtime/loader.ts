import fs from "fs/promises"
import path from "path"
import type { PageData, PageFrontmatter, TOCItem, ResolvedConfig } from "../config/types"
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

export async function loadDoc(options: LoadDocOptions): Promise<LoadDocResult | null> {
  const { slug, contentDir, config } = options

  const possiblePaths = [
    path.join(contentDir, `${slug}.md`),
    path.join(contentDir, slug, "index.md"),
  ]

  let filePath: string | null = null
  let fileContent: string | null = null

  for (const tryPath of possiblePaths) {
    try {
      fileContent = await fs.readFile(tryPath, "utf-8")
      filePath = tryPath
      break
    } catch {
      continue
    }
  }

  if (!filePath || !fileContent) {
    return null
  }

  const result = await transformMarkdown(fileContent, config.markdown)
  const relativePath = path.relative(contentDir, filePath)

  let lastUpdated: number | undefined
  try {
    const stat = await fs.stat(filePath)
    lastUpdated = stat.mtimeMs
  } catch {
    // Ignore stat errors
  }

  return {
    content: result.html,
    frontmatter: result.frontmatter,
    toc: result.toc,
    filePath,
    relativePath,
    lastUpdated,
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
        const fileContent = await fs.readFile(fullPath, "utf-8")
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
          title: result.frontmatter.title || formatTitle(entry.name.replace(/\.md$/, "")),
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
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getSlugFromPath(relativePath: string): string {
  return relativePath
    .replace(/\.md$/, "")
    .replace(/\/index$/, "")
    .replace(/\\/g, "/")
}

export function getPageDataForRoute(docs: PageData[], slug: string): PageData | undefined {
  return docs.find((doc) => {
    const docSlug = getSlugFromPath(doc.relativePath)
    return docSlug === slug || docSlug === `${slug}/index`
  })
}
