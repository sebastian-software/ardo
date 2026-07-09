import path from "node:path"

import { stripTrailingExtension } from "./path-utils"
import {
  type RouteManifestEntry,
  type RouteManifestOptions,
  scanRouteManifest,
} from "./route-manifest"

export type SearchDoc = {
  id: string
  title: string
  content: string
  path: string
  publicPath: string
  routePath: string
  localeId?: string
  section?: string
  versionId?: string
}

export async function generateSearchIndex(
  routesDir: string,
  options: RouteManifestOptions = {}
): Promise<SearchDoc[]> {
  const entries = await scanRouteManifest(routesDir, options)
  return entries
    .filter((entry) => isSearchableEntry(entry))
    .map((entry) => createSearchDocFromEntry(entry))
}

function createSearchDocFromEntry(entry: RouteManifestEntry): SearchDoc {
  const title = entry.metadata.title ?? formatTitle(getSearchTitleSource(entry.metadata.sourcePath))
  const content = sanitizeSearchContent(entry.content)

  return {
    id: entry.metadata.sourcePath,
    title,
    content,
    path: entry.routePath,
    publicPath: entry.publicPath,
    routePath: entry.routePath,
    ...(entry.metadata.localeId == null ? {} : { localeId: entry.metadata.localeId }),
    section: createSectionFromSourcePath(entry.metadata.sourcePath),
    ...(entry.metadata.versionId == null ? {} : { versionId: entry.metadata.versionId }),
  }
}

function sanitizeSearchContent(content: string): string {
  const withoutCodeFences = removeCodeFences(content)
  const withoutImportLines = removeImportLines(withoutCodeFences)
  const normalizedText = replacePunctuationWithSpaces(withoutImportLines)
  const collapsedWhitespace = collapseWhitespace(normalizedText)
  return collapsedWhitespace.slice(0, 2000)
}

function removeCodeFences(content: string): string {
  const lines = content.split("\n")
  const keptLines: string[] = []
  let isInsideFence = false

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      isInsideFence = !isInsideFence
      continue
    }

    if (!isInsideFence) {
      keptLines.push(line)
    }
  }

  return keptLines.join("\n")
}

function removeImportLines(content: string): string {
  const lines = content.split("\n")
  const keptLines: string[] = []

  for (const line of lines) {
    if (!line.trimStart().startsWith("import ")) {
      keptLines.push(line)
    }
  }

  return keptLines.join("\n")
}

function replacePunctuationWithSpaces(content: string): string {
  let normalized = content
  for (const token of ["`", "#", "*", "_", "~", "[", "]", "(", ")", "<", ">", "|", "!"]) {
    normalized = normalized.replaceAll(token, " ")
  }

  return normalized
}

function collapseWhitespace(content: string): string {
  let result = ""
  let previousWasSpace = false

  for (const character of content) {
    const isSpace =
      character === " " || character === "\n" || character === "\t" || character === "\r"
    if (isSpace) {
      if (!previousWasSpace) {
        result += " "
      }
      previousWasSpace = true
      continue
    }

    result += character
    previousWasSpace = false
  }

  return result.trim()
}

function isSearchableEntry(entry: RouteManifestEntry): boolean {
  return entry.source === "markdown"
}

function createSectionFromSourcePath(sourcePath: string): string | undefined {
  const directoryPath = path.dirname(sourcePath).replaceAll("\\", "/")
  if (directoryPath === ".") {
    return undefined
  }

  return directoryPath
    .split("/")
    .map((segment) => formatTitle(segment))
    .join(" > ")
}

function getSearchTitleSource(sourcePath: string): string {
  const extension = sourcePath.endsWith(".mdx") ? ".mdx" : ".md"
  return stripTrailingExtension(path.basename(sourcePath), extension)
}

function formatTitle(name: string): string {
  return name.replaceAll(/[_-]/g, " ").replaceAll(/\b\w/g, (char) => char.toUpperCase())
}
