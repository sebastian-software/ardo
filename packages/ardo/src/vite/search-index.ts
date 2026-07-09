import path from "node:path"

import { createHeadingSlugger } from "../markdown/heading-slug"
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
  const manifest: SearchManifest = {
    version: 2,
    recordCount: records.length,
    chunks: [{ file: chunkFile, recordCount: records.length }],
  }

  return [
    { fileName: "search/manifest.json", source: `${JSON.stringify(manifest, null, 2)}\n` },
    { fileName: chunkFile, source: `${JSON.stringify(records)}\n` },
  ]
}

function createEntryRecords(entry: RouteManifestEntry): SearchDoc[] {
  const pageTitle =
    entry.metadata.title ?? formatTitle(getSearchTitleSource(entry.metadata.sourcePath))
  const routeGroup = createSectionFromSourcePath(entry.metadata.sourcePath)
  const sections = splitMarkdownSections(entry.content)
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

function splitMarkdownSections(content: string): MarkdownSection[] {
  const slugger = createHeadingSlugger()
  const sections: MarkdownSection[] = [{ content: "", headingHierarchy: [] }]
  const headingStack: Array<{ level: number; title: string }> = []

  for (const line of content.split("\n")) {
    const heading = parseMarkdownHeading(line)
    if (heading == null) {
      appendSectionContentLine(sections, line)
      continue
    }

    removeCompletedHeadings(headingStack, heading.level)
    headingStack.push({ level: heading.level, title: heading.title })
    sections.push({
      anchor: slugger.slug(heading.rawTitle),
      content: "",
      headingHierarchy: headingStack.map((entry) => entry.title),
      title: heading.title,
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

function appendSectionContentLine(sections: MarkdownSection[], line: string): void {
  const currentSection = sections.at(-1)
  if (currentSection != null) {
    currentSection.content += `${line}\n`
  }
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

function parseMarkdownHeading(
  line: string
): { level: number; rawTitle: string; title: string } | null {
  const trimmed = line.trimStart()
  let level = 0
  for (const character of trimmed) {
    if (character !== "#") break
    level++
  }

  if (level === 0 || level > 6 || trimmed[level] !== " ") {
    return null
  }

  const rawTitle = trimmed.slice(level + 1)
  return { level, rawTitle, title: sanitizeHeadingTitle(rawTitle) }
}

function sanitizeHeadingTitle(title: string): string {
  return collapseWhitespace(replacePunctuationWithSpaces(stripHtmlTags(title)))
}

function stripHtmlTags(value: string): string {
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
