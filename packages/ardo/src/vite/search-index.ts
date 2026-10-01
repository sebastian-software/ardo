import type { JsxHeading } from "ferromark"

import path from "node:path"

import { readNativeMarkdownMetadata } from "../markdown/native-metadata"
import { getMarkdownFenceMarker, type MarkdownFenceMarker } from "./markdown-fence"
import { stripTrailingExtension } from "./path-utils"
import {
  type RouteManifestEntry,
  type RouteManifestOptions,
  scanRouteManifest,
} from "./route-manifest"

export type SearchDoc = {
  id: string
  title: string
  pageTitle: string
  content: string
  excerpt: string
  path: string
  publicPath: string
  routePath: string
  anchor?: string
  headingHierarchy: string[]
  localeId?: string
  routeGroup?: string
  section?: string
  versionId?: string
}

export type SearchManifest = {
  version: 2
  recordCount: number
  chunks: Array<{
    byteSize: number
    file: string
    recordCount: number
  }>
}

export async function generateSearchIndex(
  routesDir: string,
  options: RouteManifestOptions = {}
): Promise<SearchDoc[]> {
  const entries = await scanRouteManifest(routesDir, options)
  return createSearchRecords(entries)
}

export function createSearchRecords(entries: RouteManifestEntry[]): SearchDoc[] {
  return entries
    .filter((entry) => isSearchableEntry(entry))
    .flatMap((entry) => createEntryRecords(entry))
}

export function createSearchAssets(entries: RouteManifestEntry[]): Array<{
  fileName: string
  source: string
}> {
  const records = createSearchRecords(entries)
  const chunkFile = "search/chunk-0.json"
  const chunkSource = `${JSON.stringify(records)}\n`
  const chunkByteSize = new TextEncoder().encode(chunkSource).byteLength
  const manifest: SearchManifest = {
    version: 2,
    recordCount: records.length,
    chunks: [{ byteSize: chunkByteSize, file: chunkFile, recordCount: records.length }],
  }

  return [
    { fileName: "search/manifest.json", source: `${JSON.stringify(manifest, null, 2)}\n` },
    { fileName: chunkFile, source: chunkSource },
  ]
}

function createEntryRecords(entry: RouteManifestEntry): SearchDoc[] {
  const pageTitle =
    entry.metadata.title ?? formatTitle(getSearchTitleSource(entry.metadata.sourcePath))
  const routeGroup = createSectionFromSourcePath(entry.metadata.sourcePath)
  const headings =
    entry.headings ??
    readNativeMarkdownMetadata(
      entry.content,
      entry.metadata.sourcePath.endsWith(".mdx") ? "mdx" : "md"
    ).headings
  const sections = splitMarkdownSections(entry.content, headings)
  return sections.flatMap((section, index): SearchDoc[] => {
    const excerpt = sanitizeSearchContent(section.content)
    if (excerpt === "" && section.anchor == null) {
      return []
    }

    const title = section.title ?? pageTitle
    const headingHierarchy =
      section.headingHierarchy.length === 0 ? [pageTitle] : section.headingHierarchy
    const pathWithAnchor = appendAnchor(entry.routePath, section.anchor)
    const publicPathWithAnchor = appendAnchor(entry.publicPath, section.anchor)

    return [
      {
        id: `${entry.metadata.sourcePath}#${section.anchor ?? `page-${index}`}`,
        title,
        pageTitle,
        content: joinSearchTextParts([title, pageTitle, ...headingHierarchy, excerpt]),
        excerpt,
        path: pathWithAnchor,
        publicPath: publicPathWithAnchor,
        routePath: entry.routePath,
        ...(section.anchor == null ? {} : { anchor: section.anchor }),
        headingHierarchy,
        ...(entry.metadata.localeId == null ? {} : { localeId: entry.metadata.localeId }),
        ...(routeGroup == null ? {} : { routeGroup, section: routeGroup }),
        ...(entry.metadata.versionId == null ? {} : { versionId: entry.metadata.versionId }),
      },
    ]
  })
}

type MarkdownSection = {
  anchor?: string
  content: string
  headingHierarchy: string[]
  title?: string
}

function splitMarkdownSections(content: string, headings: JsxHeading[]): MarkdownSection[] {
  const source = Buffer.from(content)
  const sections: MarkdownSection[] = []
  const headingStack: Array<{ level: number; title: string }> = []
  const linkedHeadings = headings.filter((heading) => heading.id != null)
  const firstHeading = linkedHeadings.at(0)
  sections.push({
    content: source.subarray(0, firstHeading?.start ?? source.length).toString(),
    headingHierarchy: [],
  })
  for (const [index, heading] of linkedHeadings.entries()) {
    removeCompletedHeadings(headingStack, heading.level)
    headingStack.push({ level: heading.level, title: heading.text })
    sections.push({
      anchor: heading.id,
      content: source
        .subarray(heading.end, linkedHeadings.at(index + 1)?.start ?? source.length)
        .toString(),
      headingHierarchy: headingStack.map((entry) => entry.title),
      title: heading.text,
    })
  }

  return sections
}

function joinSearchTextParts(parts: string[]): string {
  const seen = new Set<string>()
  const uniqueParts: string[] = []
  for (const part of parts) {
    const normalizedPart = collapseWhitespace(part)
    if (normalizedPart === "" || seen.has(normalizedPart)) {
      continue
    }

    seen.add(normalizedPart)
    uniqueParts.push(normalizedPart)
  }

  return uniqueParts.join(" ")
}

function removeCompletedHeadings(
  headingStack: Array<{ level: number; title: string }>,
  nextLevel: number
): void {
  let currentHeading = headingStack.at(-1)
  while (currentHeading != null && currentHeading.level >= nextLevel) {
    headingStack.pop()
    currentHeading = headingStack.at(-1)
  }
}

function appendAnchor(routePath: string, anchor: string | undefined): string {
  return anchor == null ? routePath : `${routePath}#${anchor}`
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
  let fenceMarker: MarkdownFenceMarker | null = null

  for (const line of lines) {
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

    keptLines.push(line)
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
