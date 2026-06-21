import type { Dirent } from "node:fs"

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

export type RouteManifestEntry = {
  anchors: string[]
  content: string
  filePath: string
  frontmatter: {
    redirectFrom?: string[]
    sitemap?: boolean
  }
  lastmod: Date
  path: string
}

export async function scanRouteManifest(routesDir: string): Promise<RouteManifestEntry[]> {
  const entries: RouteManifestEntry[] = []
  await scanRouteDirectory(routesDir, routesDir, entries)
  return entries.sort((left, right) => left.path.localeCompare(right.path))
}

async function scanRouteDirectory(
  dir: string,
  routesDir: string,
  manifestEntries: RouteManifestEntry[]
) {
  let entries: Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await scanRouteDirectory(fullPath, routesDir, manifestEntries)
      continue
    }

    const manifestEntry = await createManifestEntry(fullPath, routesDir)
    if (manifestEntry != null) {
      manifestEntries.push(manifestEntry)
    }
  }
}

async function createManifestEntry(
  filePath: string,
  routesDir: string
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

  return {
    anchors: extractAnchors(parsed.content),
    content: parsed.content,
    filePath,
    frontmatter: {
      redirectFrom: parseRedirectFrom(data.redirectFrom),
      sitemap: typeof data.sitemap === "boolean" ? data.sitemap : undefined,
    },
    lastmod: stat.mtime,
    path: toRoutePath(relativePath, extension),
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
  const anchors = new Set<string>()
  for (const line of content.split("\n")) {
    const headingText = getMarkdownHeadingText(line)
    if (headingText != null) anchors.add(slugifyHeading(headingText))
  }
  return [...anchors]
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

function slugifyHeading(value: string) {
  return stripHtmlTags(value)
    .replaceAll(/[`*_~[\]()]/gu, "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^\d\p{Letter}\s-]/gu, "")
    .replaceAll(/\s+/gu, "-")
}

function stripHtmlTags(value: string) {
  let result = ""
  let isInsideTag = false
  for (const character of value) {
    if (character === "<") {
      isInsideTag = true
      continue
    }

    if (character === ">") {
      isInsideTag = false
      continue
    }

    if (!isInsideTag) result += character
  }
  return result
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
