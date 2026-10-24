import type { TextExtraction } from "ferromark"

import path from "node:path"

import { readNativeMarkdownMetadata } from "../markdown/native-metadata"
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

function createEntryRecords(entry: RouteManifestEntry): SearchDoc[] {
  const pageTitle =
    entry.metadata.title ?? formatTitle(getSearchTitleSource(entry.metadata.sourcePath))
  const routeGroup = createSectionFromSourcePath(entry.metadata.sourcePath)
  const text =
    entry.searchText ??
    readNativeMarkdownMetadata(
      entry.content,
      entry.metadata.sourcePath.endsWith(".mdx") ? "mdx" : "md"
    ).searchText
  const sections = splitTextSections(text)
  return sections.flatMap((section, index): SearchDoc[] => {
    const excerpt = collapseWhitespace(section.content).slice(0, 2000)
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

type SearchSection = {
  anchor?: string
  content: string
  headingHierarchy: string[]
  title?: string
}

function splitTextSections(extraction: TextExtraction): SearchSection[] {
  const text = Buffer.from(extraction.text)
  const sections: SearchSection[] = []
  const headingStack: Array<{ level: number; title: string }> = []
  const linkedHeadings = extraction.sections.filter((heading) => heading.id != null)
  const firstHeading = linkedHeadings.at(0)
  sections.push({
    content: text.subarray(0, firstHeading?.textRange.start ?? text.length).toString(),
    headingHierarchy: [],
  })
  for (const [index, heading] of linkedHeadings.entries()) {
    removeCompletedHeadings(headingStack, heading.level)
    headingStack.push({ level: heading.level, title: heading.heading })
    sections.push({
      anchor: heading.id,
      content: text
        .subarray(
          heading.textRange.start + Buffer.byteLength(heading.heading),
          linkedHeadings.at(index + 1)?.textRange.start ?? text.length
        )
        .toString(),
      headingHierarchy: headingStack.map((entry) => entry.title),
      title: heading.heading,
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
