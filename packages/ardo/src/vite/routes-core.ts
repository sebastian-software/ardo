import fsSync from "node:fs"
import path from "node:path"

import { stripTrailingExtension } from "./path-utils"

export type RouteInfo = {
  /** Absolute path of the route file */
  filePath: string
  /** File path relative to app directory (e.g., "routes/guide/getting-started.mdx") */
  file: string
  /** True if this is an index route */
  isIndex?: boolean
  /** URL path (e.g., "/guide/getting-started") */
  path: string
}

export function scanRoutesSync(params: { dir: string; rootDir: string }): RouteInfo[] {
  const routes = scanRouteDirectory(params)
  assertUniqueRoutePaths(routes)
  return routes
}

function scanRouteDirectory({ dir, rootDir }: { dir: string; rootDir: string }): RouteInfo[] {
  const routes: RouteInfo[] = []
  const entries = readDirectoryEntries(dir)

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      routes.push(...scanRouteDirectory({ dir: fullPath, rootDir }))
      continue
    }

    const route = createRouteInfo({ entryName: entry.name, fullPath, rootDir })
    if (route != null) {
      routes.push(route)
    }
  }

  return routes
}

function assertUniqueRoutePaths(routes: RouteInfo[]): void {
  const filesByPath = new Map<string, string[]>()
  for (const route of routes) {
    const files = filesByPath.get(route.path) ?? []
    files.push(route.filePath)
    filesByPath.set(route.path, files)
  }
  const collisions = [...filesByPath].filter(([, files]) => files.length > 1)
  if (collisions.length === 0) return

  const details = collisions
    .map(([routePath, files]) => `- ${routePath}\n${files.map((file) => `  - ${file}`).join("\n")}`)
    .join("\n")
  throw new Error(`[ardo] Multiple route files resolve to the same URL:\n${details}`)
}

function readDirectoryEntries(dir: string): fsSync.Dirent[] {
  try {
    return fsSync.readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

function createRouteInfo(params: {
  entryName: string
  fullPath: string
  rootDir: string
}): null | RouteInfo {
  const { entryName, fullPath, rootDir } = params
  if (!isRouteFile(entryName) || isIgnoredRouteFile(entryName)) {
    return null
  }

  const extension = getRouteExtension(entryName)
  if (extension == null) {
    return null
  }

  const relativePath = path.relative(rootDir, fullPath)
  const baseName = stripTrailingExtension(entryName, extension)
  const urlPath = toRoutePath({
    baseName,
    extension,
    relativePath,
  })

  return {
    file: `routes/${relativePath.replaceAll("\\", "/")}`,
    filePath: fullPath,
    isIndex: isIndexRoute(baseName),
    path: urlPath,
  }
}

function isRouteFile(entryName: string): boolean {
  return entryName.endsWith(".md") || entryName.endsWith(".mdx") || entryName.endsWith(".tsx")
}

function isIgnoredRouteFile(entryName: string): boolean {
  return entryName === "root.tsx" || entryName.startsWith("_")
}

function getRouteExtension(entryName: string): ".md" | ".mdx" | ".tsx" | null {
  if (entryName.endsWith(".mdx")) {
    return ".mdx"
  }

  if (entryName.endsWith(".md")) {
    return ".md"
  }

  if (entryName.endsWith(".tsx")) {
    return ".tsx"
  }

  return null
}

function toRoutePath(params: {
  baseName: string
  extension: ".md" | ".mdx" | ".tsx"
  relativePath: string
}): string {
  const { baseName, extension, relativePath } = params

  if (isIndexRoute(baseName)) {
    const parentDir = path.dirname(relativePath)
    const normalizedParent = parentDir === "." ? "" : parentDir.replaceAll("\\", "/")
    return applyDynamicSegments(`/${normalizedParent}`)
  }

  const withoutExtension = stripTrailingExtension(relativePath, extension)
  return applyDynamicSegments(`/${withoutExtension.replaceAll("\\", "/")}`)
}

function isIndexRoute(baseName: string): boolean {
  return baseName === "index" || baseName === "home"
}

function applyDynamicSegments(urlPath: string): string {
  return urlPath.replaceAll(/\$(\w+)/gu, ":$1")
}
