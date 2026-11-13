import type { JsxHeading, TextExtraction } from "ferromark"
import type { Dirent } from "node:fs"

import fs from "node:fs/promises"
import path from "node:path"

import type { DocumentationVersioningConfig, MarkdownConfig, ResolvedConfig } from "../config/types"

import { getDefaultLocaleId } from "../config/i18n"
import { getCurrentVersion, isVersionedRoute } from "../config/versioning"
import { type NativeMarkdownFormat, readNativeMarkdownMetadata } from "../markdown/native-metadata"
import { buildCacheKey, getBuildCache } from "./build-cache"
import {
  createPageMetadata,
  type PageFrontmatterMetadata,
  type PageMetadata,
  type PageMetadataDiagnostic,
  toFrontmatterRecord,
  validatePageFrontmatter,
} from "./page-metadata"
import { createRouteIdentity, type RouteIdentity } from "./route-identity"
import { isIgnoredRouteFile, isIndexRoute } from "./routes-core"

export type RouteManifestEntry = {
  anchors: string[]
  content: string
  filePath: string
  frontmatter: PageFrontmatterMetadata
  /** Native heading ranges refer to UTF-8 bytes in content. */
  headings?: JsxHeading[]
  /** Authored text and final heading sections from the complete prepared document. */
  searchText?: TextExtraction
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
  deploymentBase?: string
  versioning?: DocumentationVersioningConfig | false
  basePath?: string
  localeIds?: string[]
  localeId?: string
  versionId?: string
  markdown?: MarkdownConfig
  /** Project root whose persistent build cache keeps parsed route metadata. */
  cacheRoot?: string
}

export function createRouteManifestOptions(
  config: { markdown?: MarkdownConfig; deploymentBase?: string; root?: string } & Pick<
    ResolvedConfig,
    "base" | "i18n" | "versioning"
  >
): RouteManifestOptions {
  return {
    cacheRoot: config.root,
    deploymentBase: config.deploymentBase,
    versioning: config.versioning,
    basePath: config.base,
    localeIds: config.i18n === false ? undefined : config.i18n.locales.map((locale) => locale.id),
    localeId: getDefaultLocaleId(config.i18n),
    versionId: config.versioning === false ? undefined : config.versioning.current,
    markdown: config.markdown,
  }
}

export async function scanRouteManifest(
  routesDir: string,
  options: RouteManifestOptions = {}
): Promise<RouteManifestEntry[]> {
  const entries: RouteManifestEntry[] = []
  for (const filePath of await listRouteFiles(routesDir)) {
    const manifestEntry = await createManifestEntry(filePath, routesDir, options)
    if (manifestEntry != null) {
      entries.push(manifestEntry)
    }
  }
  // A fixed locale keeps the order, and so llms.txt and the route chunks, the same on every machine.
  return entries.sort((left, right) => left.routePath.localeCompare(right.routePath, "en"))
}

/**
 * Whether a route has parameters (`$id` files become `:id`) and therefore no single page. Mirrors
 * the runtime's `isDynamicRoute`, so build outputs list exactly the pages that are prerendered.
 */
export function isDynamicRoutePath(routePath: string): boolean {
  return routePath.includes(":")
}

/** Every Markdown, MDX, and TSX route file under the routes directory, sorted by path. */
export async function listRouteFiles(routesDir: string): Promise<string[]> {
  const files: string[] = []
  await collectRouteFiles(routesDir, files)
  return files.sort()
}

async function collectRouteFiles(dir: string, files: string[]): Promise<void> {
  let entries: Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectRouteFiles(fullPath, files)
    } else if (getRouteExtension(fullPath) != null && !isIgnoredRouteFile(entry.name)) {
      files.push(fullPath)
    }
  }
}

/** The manifest entry for one route file, or null for files that are not routes. */
export async function createManifestEntry(
  filePath: string,
  routesDir: string,
  options: RouteManifestOptions
): Promise<null | RouteManifestEntry> {
  const extension = getRouteExtension(filePath)
  if (extension == null || isIgnoredRouteFile(path.basename(filePath))) {
    return null
  }

  const content = await fs.readFile(filePath, "utf8")
  const parsed =
    extension === ".tsx"
      ? { content, frontmatter: {}, headings: [], searchText: undefined }
      : readRouteMetadata({
          filePath,
          content,
          format: extension === ".mdx" ? "mdx" : "md",
          options,
        })
  const data = toFrontmatterRecord(parsed.frontmatter)
  const stat = await fs.stat(filePath)
  const { identity, localeId, relativePath } = resolveRouteFileIdentity({
    extension,
    filePath,
    options,
    routesDir,
  })
  const frontmatterResult = validatePageFrontmatter(data)
  const frontmatter = frontmatterResult.frontmatter

  return {
    anchors: parsed.headings.flatMap((heading) => (heading.id == null ? [] : [heading.id])),
    content: parsed.content,
    headings: parsed.headings,
    ...(parsed.searchText == null ? {} : { searchText: parsed.searchText }),
    filePath,
    frontmatter,
    frontmatterDiagnostics: frontmatterResult.diagnostics,
    identity,
    lastmod:
      typeof frontmatter.publishedAt === "string" &&
      Number.isFinite(Date.parse(frontmatter.updatedAt ?? frontmatter.publishedAt))
        ? new Date(frontmatter.updatedAt ?? frontmatter.publishedAt)
        : stat.mtime,
    metadata: createPageMetadata({ frontmatter, identity, sourcePath: relativePath }),
    path: identity.routePath,
    publicPath: identity.publicPath,
    routePath: identity.routePath,
    sourceLocaleId: localeId,
    source: extension === ".tsx" ? "tsx" : "markdown",
  }
}

/**
 * The identity of a route file, computed the way the manifest computes it. Build steps that
 * need one page's public URL call this, so they cannot drift from the manifest's URLs.
 */
export function resolveRouteFileIdentity(input: {
  extension: ".md" | ".mdx" | ".tsx"
  filePath: string
  options: RouteManifestOptions
  routesDir: string
}): { identity: RouteIdentity; localeId: string | undefined; relativePath: string } {
  const { extension, filePath, options, routesDir } = input
  const relativePath = path.relative(routesDir, filePath)
  const localizedRoute = splitLocaleRoute(relativePath, options.localeIds)
  const routePath = toRoutePath(localizedRoute.relativePath, extension)
  const identity = createManifestRouteIdentity(
    routePath,
    localizedRoute.localeId ?? options.localeId,
    options
  )
  return { identity, localeId: localizedRoute.localeId, relativePath }
}

export function createManifestRouteIdentity(
  routePath: string,
  localeId: string | undefined,
  options: RouteManifestOptions
): RouteIdentity {
  const versioning = options.versioning
  const scoped = versioning != null && versioning !== false && versioning.directories != null
  const versioned = isVersionedRoute(routePath, versioning)
  return createRouteIdentity({
    basePath: scoped
      ? versioned
        ? getCurrentVersion(versioning)?.path
        : (options.deploymentBase ?? options.basePath)
      : options.basePath,
    localeId,
    routePath,
    versionId: scoped && !versioned ? undefined : options.versionId,
  })
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

function toRoutePath(relativePath: string, extension: ".md" | ".mdx" | ".tsx") {
  const normalizedPath = relativePath.replaceAll("\\", "/")
  const withoutExtension = normalizedPath.slice(0, -extension.length)
  const segments = withoutExtension.split("/")
  const lastSegment = segments.at(-1)

  if (lastSegment != null && isIndexRoute(lastSegment)) {
    const parentSegments = segments.slice(0, -1)
    return parentSegments.length === 0 ? "/" : `/${parentSegments.join("/")}`
  }

  return `/${withoutExtension}`.replaceAll(/\$(\w+)/gu, ":$1")
}

type RouteMetadata = ReturnType<typeof readNativeMarkdownMetadata>

/**
 * One build scans the routes several times (search, outputs, redirects), and a rebuild sees
 * mostly unchanged files. Parse each exact source once per process, and once per project while
 * the persistent cache keeps it.
 */
const parsedRoutes = new Map<string, { key: string; metadata: RouteMetadata }>()

function readRouteMetadata({
  filePath,
  content,
  format,
  options,
}: {
  filePath: string
  content: string
  format: NativeMarkdownFormat
  options: RouteManifestOptions
}): RouteMetadata {
  const key = buildCacheKey("route-metadata", format, options.markdown ?? null, content)
  const parsed = parsedRoutes.get(filePath)
  if (parsed?.key === key) return parsed.metadata
  const cache = options.cacheRoot == null ? undefined : getBuildCache(options.cacheRoot)
  let metadata = cache?.read<RouteMetadata>("route-metadata", key)
  if (metadata == null) {
    metadata = readNativeMarkdownMetadata(content, format, options.markdown)
    cache?.write("route-metadata", key, metadata)
  }
  parsedRoutes.set(filePath, { key, metadata })
  return metadata
}
