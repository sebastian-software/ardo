import type { Dirent } from "node:fs"

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

import type { SidebarConfig, SidebarItem } from "../config/types"

type SidebarNode = {
  text: string
  link?: string
  items?: SidebarNode[]
  collapsed?: boolean
  order?: number
  sectionId: string
}

type SidebarFrontmatter = {
  collapsed?: boolean
  order?: number
  /**
   * Sidebar inclusion mode:
   * - `false` → hide this file/folder entirely
   * - `"leaf"` (directory index only) → show the folder as a single link,
   *   without auto-listing its children. The folder's index page is
   *   expected to render the detail list itself.
   * - `true` / `undefined` → default tree behaviour
   */
  sidebar?: "leaf" | boolean
  title?: string
}

export async function generateSidebar(
  routesDir: string,
  options: SidebarConfig = {}
): Promise<SidebarItem[]> {
  try {
    const nodes = await scanSidebarDirectory(routesDir, routesDir)
    sortNodesBySectionOrder(nodes, options.sectionOrder)
    return nodes.map((node) => stripOrderFromNode(node))
  } catch {
    return []
  }
}

/**
 * Build one sidebar tree per top-level routes folder.
 *
 * The flat `generateSidebar` returns a single nested array — fine for sites
 * where everything lives in one column. For context-driven sites (Guide vs.
 * API vs. …) each top-level folder gets its own subtree, keyed by folder
 * name (`guide`, `api-reference`, …). Top-level files like `home.tsx` are
 * skipped — they belong to a bare layout, not a sidebar context.
 */
export async function generateContextSidebars(
  routesDir: string
): Promise<Record<string, SidebarItem[]>> {
  try {
    const entries = await fs.readdir(routesDir, { withFileTypes: true })
    const sidebars: Record<string, SidebarItem[]> = {}
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const subDir = path.join(routesDir, entry.name)
      // Pass `routesDir` as the root so links remain absolute (`/guide/foo`),
      // not relative to the sub-folder.
      const nodes = await scanSidebarDirectory(subDir, routesDir)
      if (nodes.length > 0) {
        sidebars[entry.name] = nodes.map((node) => stripOrderFromNode(node))
      }
    }
    return sidebars
  } catch {
    return {}
  }
}

async function scanSidebarDirectory(dir: string, rootDir: string): Promise<SidebarNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nodes: SidebarNode[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(rootDir, fullPath)

    if (entry.isDirectory()) {
      const directoryNode = await createDirectoryNode(entry, fullPath, rootDir)
      if (directoryNode != null) {
        nodes.push(directoryNode)
      }
      continue
    }

    const fileNode = await createMarkdownNode(entry, fullPath, relativePath)
    if (fileNode != null) {
      nodes.push(fileNode)
    }
  }

  sortNodes(nodes)
  return nodes
}

async function createDirectoryNode(
  entry: Dirent,
  fullPath: string,
  rootDir: string
): Promise<null | SidebarNode> {
  const relativePath = path.relative(rootDir, fullPath)
  const metadata = await readDirectoryIndexMetadata(fullPath)

  if (metadata?.sidebar === false) {
    return null
  }

  const link = metadata == null ? undefined : `/${relativePath.replaceAll("\\", "/")}`

  if (metadata?.sidebar === "leaf") {
    // Show the folder as a single link without auto-listing its children.
    // Requires an index page to provide a valid link.
    if (link === undefined) return null
    return {
      text: metadata.title ?? formatTitle(entry.name),
      link,
      order: metadata.order,
      sectionId: entry.name,
    }
  }

  const children = await scanSidebarDirectory(fullPath, rootDir)
  if (children.length === 0) {
    return null
  }

  return {
    text: metadata?.title ?? formatTitle(entry.name),
    link,
    items: children,
    collapsed: metadata?.collapsed,
    order: metadata?.order,
    sectionId: entry.name,
  }
}

async function createMarkdownNode(
  entry: Dirent,
  fullPath: string,
  relativePath: string
): Promise<null | SidebarNode> {
  if (!isSidebarMarkdownFile(entry.name)) {
    return null
  }

  const extension = entry.name.endsWith(".mdx") ? ".mdx" : ".md"
  const fileContent = await fs.readFile(fullPath, "utf8")
  const frontmatter = readFrontmatterSafely(fullPath, fileContent)
  if (frontmatter == null) {
    return null
  }

  if (frontmatter.sidebar === false) {
    return null
  }

  const title = frontmatter.title ?? formatTitle(entry.name.replace(extension, ""))
  const link = `/${relativePath.replace(extension, "").replaceAll("\\", "/")}`

  return {
    text: title,
    link,
    order: frontmatter.order,
    sectionId: entry.name.replace(extension, ""),
  }
}

async function readDirectoryIndexMetadata(fullPath: string): Promise<null | SidebarFrontmatter> {
  for (const indexFileName of ["index.mdx", "index.md"]) {
    const metadata = await readFrontmatterFile(path.join(fullPath, indexFileName))
    if (metadata != null) {
      return metadata
    }
  }

  return null
}

async function readFrontmatterFile(filePath: string): Promise<null | SidebarFrontmatter> {
  try {
    const fileContent = await fs.readFile(filePath, "utf8")
    return readFrontmatterSafely(filePath, fileContent)
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      warnFrontmatterReadFailure(filePath, error)
    }
    return null
  }
}

function readFrontmatterSafely(filePath: string, fileContent: string): null | SidebarFrontmatter {
  try {
    return readFrontmatter(fileContent)
  } catch (error) {
    warnFrontmatterReadFailure(filePath, error)
    return null
  }
}

function readFrontmatter(fileContent: string): SidebarFrontmatter {
  const parsed = matter(fileContent)
  const title = typeof parsed.data.title === "string" ? parsed.data.title : undefined
  const order = typeof parsed.data.order === "number" ? parsed.data.order : undefined
  const collapsed = typeof parsed.data.collapsed === "boolean" ? parsed.data.collapsed : undefined
  const sidebar = parseSidebarValue(parsed.data.sidebar)
  return { title, order, collapsed, sidebar }
}

function parseSidebarValue(raw: unknown): SidebarFrontmatter["sidebar"] {
  if (typeof raw === "boolean") return raw
  if (raw === "leaf") return "leaf"
  return undefined
}

function warnFrontmatterReadFailure(filePath: string, error: unknown): void {
  console.warn(`[ardo] Skipping sidebar metadata for ${filePath}: ${formatErrorMessage(error)}`)
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  )
}

function sortNodes(nodes: SidebarNode[]): void {
  nodes.sort((leftNode, rightNode) => {
    if (leftNode.order != null && rightNode.order != null) {
      return leftNode.order - rightNode.order
    }

    if (leftNode.order != null) {
      return -1
    }

    if (rightNode.order != null) {
      return 1
    }

    return leftNode.text.localeCompare(rightNode.text)
  })
}

function sortNodesBySectionOrder(nodes: SidebarNode[], sectionOrder: string[] | undefined): void {
  if (sectionOrder == null || sectionOrder.length === 0) {
    return
  }

  const sectionOrderMap = new Map<string, number>()
  for (const [index, section] of sectionOrder.entries()) {
    const normalizedSection = normalizeSectionId(section)
    if (normalizedSection !== "" && !sectionOrderMap.has(normalizedSection)) {
      sectionOrderMap.set(normalizedSection, index)
    }
  }

  if (sectionOrderMap.size === 0) {
    return
  }

  nodes.sort((leftNode, rightNode) => {
    const leftIndex = sectionOrderMap.get(leftNode.sectionId)
    const rightIndex = sectionOrderMap.get(rightNode.sectionId)

    if (leftIndex != null && rightIndex != null) {
      return leftIndex - rightIndex
    }

    if (leftIndex != null) {
      return -1
    }

    if (rightIndex != null) {
      return 1
    }

    return 0
  })
}

function isSidebarMarkdownFile(fileName: string): boolean {
  const isMarkdownFile = fileName.endsWith(".mdx") || fileName.endsWith(".md")
  const isIndexFile = fileName === "index.mdx" || fileName === "index.md"
  return isMarkdownFile && !isIndexFile
}

function formatTitle(name: string): string {
  return name.replaceAll(/[_-]/g, " ").replaceAll(/\b\w/g, (char) => char.toUpperCase())
}

function stripOrderFromNode(node: SidebarNode): SidebarItem {
  return {
    text: node.text,
    link: node.link,
    collapsed: node.collapsed,
    items: node.items?.map((item) => stripOrderFromNode(item)),
  }
}

function normalizeSectionId(section: string): string {
  const normalizedSection = section.replaceAll("\\", "/")
  let startIndex = 0
  let endIndex = normalizedSection.length

  while (startIndex < endIndex && normalizedSection[startIndex] === "/") {
    startIndex += 1
  }

  while (endIndex > startIndex && normalizedSection[endIndex - 1] === "/") {
    endIndex -= 1
  }

  return normalizedSection.slice(startIndex, endIndex)
}
