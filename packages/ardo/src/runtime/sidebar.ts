import fs from "fs/promises"
import type { Dirent } from "fs"
import path from "path"
import matter from "gray-matter"
import type { SidebarItem, ResolvedConfig } from "../config/types"

export interface SidebarGenerationOptions {
  contentDir: string
  basePath: string
  config: ResolvedConfig
}

export async function generateSidebar(options: SidebarGenerationOptions): Promise<SidebarItem[]> {
  const { contentDir, basePath, config } = options

  const configSidebar = config.themeConfig.sidebar

  if (configSidebar) {
    if (Array.isArray(configSidebar) && configSidebar.length > 0) {
      return configSidebar
    }
    if (!Array.isArray(configSidebar)) {
      return []
    }
  }

  return await scanDirectoryForSidebar(contentDir, contentDir, basePath)
}

async function scanDirectoryForSidebar(
  dir: string,
  rootDir: string,
  _basePath: string
): Promise<SidebarItem[]> {
  let entries: Dirent[]

  try {
    entries = (await fs.readdir(dir, { withFileTypes: true })) as Dirent[]
  } catch {
    return []
  }

  interface SidebarItemWithOrder extends SidebarItem {
    order?: number
  }

  const items: SidebarItemWithOrder[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(rootDir, fullPath)

    if (entry.name.startsWith(".") || entry.name.startsWith("_")) {
      continue
    }

    if (entry.isDirectory()) {
      const children = await scanDirectoryForSidebar(fullPath, rootDir, _basePath)

      if (children.length > 0) {
        const indexPath = path.join(fullPath, "index.md")
        let link: string | undefined
        let title = formatTitle(entry.name)
        let order: number | undefined

        try {
          const indexContent = await fs.readFile(indexPath, "utf-8")
          const { data: frontmatter } = matter(indexContent)

          if (frontmatter.title) {
            title = frontmatter.title
          }
          if (typeof frontmatter.order === "number") {
            order = frontmatter.order
          }

          // Don't include basePath - TanStack Router handles it automatically
          link = normalizePath(relativePath)
        } catch {
          // No index.md file
        }

        items.push({
          text: title,
          link,
          collapsed: false,
          items: children,
          order,
        })
      }
    } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
      const fileContent = await fs.readFile(fullPath, "utf-8")
      const { data: frontmatter } = matter(fileContent)

      if (frontmatter.sidebar === false) {
        continue
      }

      const title = frontmatter.title || formatTitle(entry.name.replace(/\.md$/, ""))
      const order = typeof frontmatter.order === "number" ? frontmatter.order : undefined

      // Don't include basePath - TanStack Router handles it automatically
      const link = normalizePath(relativePath.replace(/\.md$/, ""))

      items.push({
        text: title,
        link,
        order,
      })
    }
  }

  items.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    return a.text.localeCompare(b.text)
  })

  return items.map(({ order: _order, ...item }) => item)
}

function formatTitle(name: string): string {
  return name
    .replace(/^\d+-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function normalizePath(p: string): string {
  return "/" + p.replace(/\\/g, "/").replace(/^\/+/, "")
}
