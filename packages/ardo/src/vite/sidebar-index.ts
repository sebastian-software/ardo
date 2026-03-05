import type { Dirent } from "node:fs"

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

interface SidebarNode {
  text: string
  link?: string
  items?: SidebarNode[]
  order?: number
}

export interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
}

export async function generateSidebar(routesDir: string): Promise<SidebarItem[]> {
  try {
    const nodes = await scanSidebarDirectory(routesDir, routesDir)
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

  const indexPath = path.join(fullPath, "index.mdx")
  const link = (await fileExists(indexPath)) ? `/${relativePath.replaceAll("\\", "/")}` : undefined

  return {
    text: formatTitle(entry.name),
    link,
    items: children,
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

  const title = frontmatter.title ?? formatTitle(entry.name.replace(extension, ""))
  const link = `/${relativePath.replace(extension, "").replaceAll("\\", "/")}`

  return {
    text: title,
    link,
    order: frontmatter.order,
  }
}

function readFrontmatter(fileContent: string): { order?: number; title?: string } {
  const parsed = matter<{ order?: unknown; title?: unknown }>(fileContent)
  const title = typeof parsed.data.title === "string" ? parsed.data.title : undefined
  const order = typeof parsed.data.order === "number" ? parsed.data.order : undefined
  return { title, order }
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
    items: node.items?.map((item) => stripOrderFromNode(item)),
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
