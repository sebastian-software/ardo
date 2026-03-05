import type { Dirent } from "node:fs"

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

import type { ResolvedConfig, SidebarItem } from "../config/types"

export interface SidebarGenerationOptions {
  basePath: string
  config: ResolvedConfig
  contentDir: string
}

interface SidebarItemWithOrder extends SidebarItem {
  order?: number
}

interface SidebarFrontmatter {
  order?: number
  sidebar?: boolean
  title?: string
}

export async function generateSidebar(options: SidebarGenerationOptions): Promise<SidebarItem[]> {
  const { contentDir } = options
  return scanDirectoryForSidebar(contentDir, contentDir)
}

async function scanDirectoryForSidebar(dir: string, rootDir: string): Promise<SidebarItem[]> {
  const entries = await readDirectoryEntries(dir)
  const items: SidebarItemWithOrder[] = []

  for (const entry of entries) {
    const sidebarItem = await createSidebarItemFromEntry({
      dir,
      entry,
      rootDir,
    })

    if (sidebarItem != null) {
      items.push(sidebarItem)
    }
  }

  sortSidebarItems(items)
  return items.map(({ order: _order, ...item }) => item)
}

async function readDirectoryEntries(dir: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

async function createSidebarItemFromEntry(params: {
  dir: string
  entry: Dirent
  rootDir: string
}): Promise<null | SidebarItemWithOrder> {
  const { dir, entry, rootDir } = params
  if (isIgnoredEntry(entry.name)) {
    return null
  }

  const fullPath = path.join(dir, entry.name)
  const relativePath = path.relative(rootDir, fullPath)

  if (entry.isDirectory()) {
    return createDirectorySidebarItem(fullPath, relativePath, rootDir)
  }

  if (isMarkdownPage(entry.name)) {
    return createMarkdownSidebarItem(fullPath, relativePath, entry.name)
  }

  return null
}

function isIgnoredEntry(entryName: string): boolean {
  return entryName.startsWith(".") || entryName.startsWith("_")
}

function isMarkdownPage(entryName: string): boolean {
  return entryName.endsWith(".md") && entryName !== "index.md"
}

async function createDirectorySidebarItem(
  fullPath: string,
  relativePath: string,
  rootDir: string
): Promise<null | SidebarItemWithOrder> {
  const children = await scanDirectoryForSidebar(fullPath, rootDir)
  if (children.length === 0) {
    return null
  }

  const metadata = await readDirectoryIndexMetadata(fullPath, relativePath)
  const title = metadata.title ?? formatTitle(path.basename(fullPath))

  return {
    collapsed: false,
    items: children,
    link: metadata.link,
    order: metadata.order,
    text: title,
  }
}

async function readDirectoryIndexMetadata(
  fullPath: string,
  relativePath: string
): Promise<{ link?: string; order?: number; title?: string }> {
  const indexPath = path.join(fullPath, "index.md")
  const frontmatter = await readFrontmatter(indexPath)

  return {
    link: frontmatter == null ? undefined : normalizePath(relativePath),
    order: frontmatter?.order,
    title: frontmatter?.title,
  }
}

async function createMarkdownSidebarItem(
  fullPath: string,
  relativePath: string,
  fileName: string
): Promise<null | SidebarItemWithOrder> {
  const frontmatter = await readFrontmatter(fullPath)
  if (frontmatter?.sidebar === false) {
    return null
  }

  const fallbackTitle = formatTitle(fileName.replace(/\.md$/u, ""))
  const title = frontmatter?.title ?? fallbackTitle

  return {
    link: normalizePath(relativePath.replace(/\.md$/u, "")),
    order: frontmatter?.order,
    text: title,
  }
}

async function readFrontmatter(filePath: string): Promise<null | SidebarFrontmatter> {
  try {
    const fileContent = await fs.readFile(filePath, "utf8")
    const parsed = matter(fileContent)
    return toSidebarFrontmatter(parsed.data)
  } catch {
    return null
  }
}

function toSidebarFrontmatter(data: unknown): SidebarFrontmatter {
  if (!isRecord(data)) {
    return {}
  }

  return {
    order: typeof data.order === "number" ? data.order : undefined,
    sidebar: typeof data.sidebar === "boolean" ? data.sidebar : undefined,
    title: typeof data.title === "string" ? data.title : undefined,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}

function sortSidebarItems(items: SidebarItemWithOrder[]): void {
  items.sort((left, right) => {
    if (left.order != null && right.order != null) {
      return left.order - right.order
    }

    if (left.order != null) {
      return -1
    }

    if (right.order != null) {
      return 1
    }

    return left.text.localeCompare(right.text)
  })
}

function formatTitle(name: string): string {
  return name
    .replace(/^\d+-/u, "")
    .replaceAll(/[_-]/gu, " ")
    .replaceAll(/\b\w/gu, (char) => char.toUpperCase())
}

function normalizePath(p: string): string {
  return `/${p.replaceAll("\\", "/").replace(/^\/+/u, "")}`
}
