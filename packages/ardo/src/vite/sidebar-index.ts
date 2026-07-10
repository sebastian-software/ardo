import type { Dirent } from "node:fs"

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

import type { SidebarConfig, SidebarItem } from "../config/types"
import type { PageFrontmatterMetadata } from "./page-metadata"
import type { RouteManifestOptions } from "./route-manifest"

import { parsePageFrontmatterMetadata, toFrontmatterRecord } from "./page-metadata"
import { stripTrailingExtension } from "./path-utils"
import { createRouteIdentity, type RouteIdentity } from "./route-identity"

type SidebarNode = {
  text: string
  link?: string
  items?: SidebarNode[]
  collapsed?: boolean
  order?: number
  sectionId: string
} & Partial<RouteIdentity>

type SidebarGenerationOptions = RouteManifestOptions & SidebarConfig

type SidebarScanContext = {
  localePrefix?: string
  options: RouteManifestOptions
  rootDir: string
}

type SidebarFrontmatter = Pick<PageFrontmatterMetadata, "collapsed" | "order" | "sidebar" | "title">

export async function generateSidebar(
  routesDir: string,
  options: SidebarGenerationOptions = {}
): Promise<SidebarItem[]> {
  try {
    const nodes = await scanSidebarDirectory(routesDir, { options, rootDir: routesDir })
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
  routesDir: string,
  options: RouteManifestOptions = {}
): Promise<Record<string, SidebarItem[]>> {
  try {
    if (options.localeIds != null && options.localeIds.length > 0) {
      return generateLocalizedContextSidebars(routesDir, options)
    }
    const entries = await fs.readdir(routesDir, { withFileTypes: true })
    const sidebars: Record<string, SidebarItem[]> = {}
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const subDir = path.join(routesDir, entry.name)
      // Pass `routesDir` as the root so links remain absolute (`/guide/foo`),
      // not relative to the sub-folder.
      const nodes = await scanSidebarDirectory(subDir, { options, rootDir: routesDir })
      if (nodes.length > 0) {
        sidebars[entry.name] = nodes.map((node) => stripOrderFromNode(node))
      }
    }
    return sidebars
  } catch {
    return {}
  }
}

async function generateLocalizedContextSidebars(
  routesDir: string,
  options: RouteManifestOptions
): Promise<Record<string, SidebarItem[]>> {
  const sidebars: Record<string, SidebarItem[]> = {}
  for (const localeId of options.localeIds ?? []) {
    const localeDir = path.join(routesDir, localeId)
    let entries: Dirent[]
    try {
      entries = await fs.readdir(localeDir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const nodes = await scanSidebarDirectory(path.join(localeDir, entry.name), {
        localePrefix: localeId,
        options: { ...options, localeId, localeIds: undefined },
        rootDir: localeDir,
      })
      if (nodes.length > 0) sidebars[`${localeId}:${entry.name}`] = nodes.map(stripOrderFromNode)
    }
  }
  return sidebars
}

async function scanSidebarDirectory(
  dir: string,
  context: SidebarScanContext
): Promise<SidebarNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nodes: SidebarNode[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      const directoryNode = await createDirectoryNode(entry, fullPath, context)
      if (directoryNode != null) {
        nodes.push(directoryNode)
      }
      continue
    }

    const fileNode = await createMarkdownNode(entry, fullPath, context)
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
  context: SidebarScanContext
): Promise<null | SidebarNode> {
  const relativePath = path.relative(context.rootDir, fullPath)
  const metadata = await readDirectoryIndexMetadata(fullPath)

  if (metadata?.sidebar === false) {
    return null
  }

  const identity =
    metadata == null ? undefined : createSidebarRouteIdentity(relativePath, context.options)
  const link = identity?.routePath

  if (metadata?.sidebar === "leaf") {
    // Show the folder as a single link without auto-listing its children.
    // Requires an index page to provide a valid link.
    if (identity == null) return null
    return {
      text: metadata.title ?? formatTitle(entry.name),
      ...toSidebarRouteFields(identity),
      order: metadata.order,
      sectionId: entry.name,
    }
  }

  const children = await scanSidebarDirectory(fullPath, context)
  if (children.length === 0) {
    return null
  }

  return {
    text: metadata?.title ?? formatTitle(entry.name),
    link,
    ...(identity == null ? {} : toSidebarRouteFields(identity, context.localePrefix)),
    items: children,
    collapsed: metadata?.collapsed,
    order: metadata?.order,
    sectionId: entry.name,
  }
}

async function createMarkdownNode(
  entry: Dirent,
  fullPath: string,
  context: SidebarScanContext
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

  const title = frontmatter.title ?? formatTitle(stripTrailingExtension(entry.name, extension))
  const relativePath = path.relative(context.rootDir, fullPath)
  const routePath = `/${stripTrailingExtension(relativePath, extension).replaceAll("\\", "/")}`
  const identity = createSidebarRouteIdentity(routePath, context.options)

  return {
    text: title,
    ...toSidebarRouteFields(identity, context.localePrefix),
    order: frontmatter.order,
    sectionId: stripTrailingExtension(entry.name, extension),
  }
}

function createSidebarRouteIdentity(
  routePath: string,
  options: RouteManifestOptions
): RouteIdentity {
  return createRouteIdentity({
    basePath: options.basePath,
    localeId: options.localeId,
    routePath,
    versionId: options.versionId,
  })
}

function toSidebarRouteFields(
  identity: RouteIdentity,
  localePrefix?: string
): Partial<RouteIdentity> & Pick<SidebarNode, "link"> {
  return {
    link: localePrefix == null ? identity.routePath : `/${localePrefix}${identity.routePath}`,
    routePath: identity.routePath,
    publicPath: identity.publicPath,
    ...(identity.versionId == null ? {} : { versionId: identity.versionId }),
    ...(identity.localeId == null ? {} : { localeId: identity.localeId }),
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
  return parsePageFrontmatterMetadata(toFrontmatterRecord(parsed.data))
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
    ...(node.link == null ? {} : { link: node.link }),
    ...(node.routePath == null ? {} : { routePath: node.routePath }),
    ...(node.publicPath == null ? {} : { publicPath: node.publicPath }),
    ...(node.versionId == null ? {} : { versionId: node.versionId }),
    ...(node.localeId == null ? {} : { localeId: node.localeId }),
    ...(node.collapsed == null ? {} : { collapsed: node.collapsed }),
    ...(node.items == null ? {} : { items: node.items.map((item) => stripOrderFromNode(item)) }),
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
