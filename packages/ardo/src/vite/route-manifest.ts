import type { Dirent } from "node:fs"

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

import type { ResolvedConfig } from "../config/types"

import { getDefaultLocaleId } from "../config/i18n"
import { createHeadingSlugger } from "../markdown/heading-slug"
import { createRouteIdentity, type RouteIdentity } from "./route-identity"

export type RouteManifestEntry = {
  anchors: string[]
  content: string
  filePath: string
  frontmatter: {
    description?: string
    llms?: boolean
    redirectFrom?: string[]
    sitemap?: boolean
    title?: string
  }
  identity: RouteIdentity
  lastmod: Date
  /** @deprecated Use routePath for internal route lookups or publicPath for canonical output. */
  path: string
  publicPath: string
  routePath: string
  source: "markdown" | "tsx"
}

export type RouteManifestOptions = {
  basePath?: string
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
  const data = toRecord(parsed.data)
  const stat = await fs.stat(filePath)
  const relativePath = path.relative(routesDir, filePath)
  const identity = createRouteIdentity({
    basePath: options.basePath,
    localeId: options.localeId,
    routePath: toRoutePath(relativePath, extension),
    versionId: options.versionId,
  })

  return {
    anchors: extractAnchors(parsed.content),
    content: parsed.content,
    filePath,
    frontmatter: {
      description: typeof data.description === "string" ? data.description : undefined,
      llms: typeof data.llms === "boolean" ? data.llms : undefined,
      redirectFrom: parseRedirectFrom(data.redirectFrom),
      sitemap: typeof data.sitemap === "boolean" ? data.sitemap : undefined,
      title: typeof data.title === "string" ? data.title : undefined,
    },
    identity,
    lastmod: stat.mtime,
    path: identity.routePath,
    publicPath: identity.publicPath,
    routePath: identity.routePath,
    source: extension === ".tsx" ? "tsx" : "markdown",
  }
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

function parseRedirectFrom(value: unknown): string[] | undefined {
  if (typeof value === "string") {
    return [value]
  }

  if (Array.isArray(value)) {
    const redirects = value.filter((entry): entry is string => typeof entry === "string")
    return redirects.length === 0 ? undefined : redirects
  }

  return undefined
}

function extractAnchors(content: string): string[] {
  const anchors: string[] = []
  const slugger = createHeadingSlugger()
  for (const line of content.split("\n")) {
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

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    return {}
  }

  const record: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry
  }
  return record
}
