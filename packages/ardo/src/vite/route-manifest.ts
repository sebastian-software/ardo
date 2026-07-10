import type { Dirent } from "node:fs"

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

import type { ResolvedConfig } from "../config/types"

import { getDefaultLocaleId } from "../config/i18n"
import { createHeadingSlugger } from "../markdown/heading-slug"
import { getMarkdownFenceMarker, type MarkdownFenceMarker } from "./markdown-fence"
import {
  createPageMetadata,
  type PageFrontmatterMetadata,
  type PageMetadata,
  type PageMetadataDiagnostic,
  toFrontmatterRecord,
  validatePageFrontmatter,
} from "./page-metadata"
import { createRouteIdentity, type RouteIdentity } from "./route-identity"

export type RouteManifestEntry = {
  anchors: string[]
  content: string
  filePath: string
  frontmatter: PageFrontmatterMetadata
  frontmatterDiagnostics?: PageMetadataDiagnostic[]
  identity: RouteIdentity
  lastmod: Date
  metadata: PageMetadata
  /** @deprecated Use routePath for internal route lookups or publicPath for canonical output. */
  path: string
  publicPath: string
  routePath: string
  /** Locale directory that directly contains this route, if any. */
  sourceLocaleId?: string
  source: "markdown" | "tsx"
}

export type RouteManifestOptions = {
  basePath?: string
  localeIds?: string[]
  localeId?: string
  versionId?: string
}

type RouteManifestScanContext = {
  entries: RouteManifestEntry[]
  options: RouteManifestOptions
  routesDir: string
}

export function createRouteManifestOptions(
  config: Pick<ResolvedConfig, "base" | "i18n" | "versioning">
): RouteManifestOptions {
  return {
    basePath: config.base,
    localeIds: config.i18n === false ? undefined : config.i18n.locales.map((locale) => locale.id),
    localeId: getDefaultLocaleId(config.i18n),
    versionId: config.versioning === false ? undefined : config.versioning.current,
  }
}

export async function scanRouteManifest(
  routesDir: string,
  options: RouteManifestOptions = {}
): Promise<RouteManifestEntry[]> {
  const entries: RouteManifestEntry[] = []
  await scanRouteDirectory(routesDir, { entries, options, routesDir })
  return entries.sort((left, right) => left.routePath.localeCompare(right.routePath))
}

async function scanRouteDirectory(dir: string, context: RouteManifestScanContext) {
  let entries: Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await scanRouteDirectory(fullPath, context)
      continue
    }

    const manifestEntry = await createManifestEntry(fullPath, context.routesDir, context.options)
    if (manifestEntry != null) {
      context.entries.push(manifestEntry)
    }
  }
}

async function createManifestEntry(
  filePath: string,
  routesDir: string,
  options: RouteManifestOptions
): Promise<null | RouteManifestEntry> {
  const extension = getRouteExtension(filePath)
  if (extension == null || isIgnoredRouteFile(path.basename(filePath))) {
    return null
  }

  const content = await fs.readFile(filePath, "utf8")
  const parsed = extension === ".tsx" ? { content, data: {} } : matter(content)
  const data = toFrontmatterRecord(parsed.data)
  const stat = await fs.stat(filePath)
  const relativePath = path.relative(routesDir, filePath)
  const localizedRoute = splitLocaleRoute(relativePath, options.localeIds)
  const identity = createRouteIdentity({
    basePath: options.basePath,
    localeId: localizedRoute.localeId ?? options.localeId,
    routePath: toRoutePath(localizedRoute.relativePath, extension),
    versionId: options.versionId,
  })
  const frontmatterResult = validatePageFrontmatter(data)
  const frontmatter = frontmatterResult.frontmatter

  return {
    anchors: extractAnchors(parsed.content),
    content: parsed.content,
    filePath,
    frontmatter,
    frontmatterDiagnostics: frontmatterResult.diagnostics,
    identity,
    lastmod: stat.mtime,
    metadata: createPageMetadata({ frontmatter, identity, sourcePath: relativePath }),
    path: identity.routePath,
    publicPath: identity.publicPath,
    routePath: identity.routePath,
    sourceLocaleId: localizedRoute.localeId,
    source: extension === ".tsx" ? "tsx" : "markdown",
  }
}

function splitLocaleRoute(relativePath: string, localeIds: string[] | undefined) {
  if (localeIds == null || localeIds.length === 0) {
    return { relativePath }
  }

  const segments = relativePath.replaceAll("\\", "/").split("/")
  const localeId = segments[0]
  if (!localeIds.includes(localeId)) {
    return { relativePath }
  }

  return { localeId, relativePath: segments.slice(1).join("/") }
}

function getRouteExtension(filePath: string): ".md" | ".mdx" | ".tsx" | null {
  if (filePath.endsWith(".mdx")) return ".mdx"
  if (filePath.endsWith(".md")) return ".md"
  if (filePath.endsWith(".tsx")) return ".tsx"
  return null
}

function isIgnoredRouteFile(entryName: string): boolean {
  return entryName === "root.tsx" || entryName.startsWith("_")
}

function toRoutePath(relativePath: string, extension: ".md" | ".mdx" | ".tsx") {
  const normalizedPath = relativePath.replaceAll("\\", "/")
  const withoutExtension = normalizedPath.slice(0, -extension.length)
  const segments = withoutExtension.split("/")
  const lastSegment = segments.at(-1)

  if (lastSegment === "index" || lastSegment === "home") {
    const parentSegments = segments.slice(0, -1)
    return parentSegments.length === 0 ? "/" : `/${parentSegments.join("/")}`
  }

  return `/${withoutExtension}`.replaceAll(/\$(\w+)/gu, ":$1")
}

function extractAnchors(content: string): string[] {
  const anchors: string[] = []
  const slugger = createHeadingSlugger()
  let fenceMarker: MarkdownFenceMarker | null = null

  for (const line of content.split("\n")) {
    const nextFenceMarker = getMarkdownFenceMarker(line)
    if (fenceMarker != null) {
      if (nextFenceMarker === fenceMarker) {
        fenceMarker = null
      }
      continue
    }

    if (nextFenceMarker != null) {
      fenceMarker = nextFenceMarker
      continue
    }

    const headingText = getMarkdownHeadingText(line)
    if (headingText != null) anchors.push(slugger.slug(headingText))
  }
  return anchors
}

function getMarkdownHeadingText(line: string): null | string {
  const trimmed = line.trimStart()
  let level = 0
  for (const character of trimmed) {
    if (character !== "#") break
    level++
  }

  if (level === 0 || level > 6 || trimmed[level] !== " ") {
    return null
  }

  return trimmed.slice(level + 1)
}
