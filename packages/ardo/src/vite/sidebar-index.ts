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
  sidebar?: boolean
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
  const children = await scanSidebarDirectory(fullPath, rootDir)
  if (children.length === 0) {
    return null
  }

  const metadata = await readDirectoryIndexMetadata(fullPath)
  const link = metadata == null ? undefined : `/${relativePath.replaceAll("\\", "/")}`

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
  const frontmatter = readFrontmatter(fileContent)
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
    return readFrontmatter(fileContent)
  } catch {
    return null
  }
}

function readFrontmatter(fileContent: string): SidebarFrontmatter {
  const parsed = matter(fileContent)
  const title = typeof parsed.data.title === "string" ? parsed.data.title : undefined
  const order = typeof parsed.data.order === "number" ? parsed.data.order : undefined
  const collapsed = typeof parsed.data.collapsed === "boolean" ? parsed.data.collapsed : undefined
  const sidebar = typeof parsed.data.sidebar === "boolean" ? parsed.data.sidebar : undefined
  return { title, order, collapsed, sidebar }
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
