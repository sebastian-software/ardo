import type { Dirent } from "node:fs"

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

export interface SearchDoc {
  id: string
  title: string
  content: string
  path: string
  section?: string
}

interface SearchScanContext {
  docs: SearchDoc[]
  routesDir: string
}

interface SearchDocBuildContext {
  routesDir: string
  section?: string
}

interface SearchEntryContext {
  dir: string
  section?: string
  scanContext: SearchScanContext
}

export async function generateSearchIndex(routesDir: string): Promise<SearchDoc[]> {
  const context: SearchScanContext = { docs: [], routesDir }
  await scanDirectoryForSearch(routesDir, undefined, context)
  return context.docs
}

async function scanDirectoryForSearch(
  dir: string,
  section: string | undefined,
  context: SearchScanContext
): Promise<void> {
  let entries: Dirent[]

  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn("[ardo] Failed to scan for search index:", errorMessage)
    return
  }

  for (const entry of entries) {
    await processSearchEntry(entry, { dir, section, scanContext: context })
  }
}

async function processSearchEntry(entry: Dirent, context: SearchEntryContext): Promise<void> {
  const fullPath = path.join(context.dir, entry.name)
  if (entry.isDirectory()) {
    const nestedSection = createNestedSection(context.section, entry.name)
    await scanDirectoryForSearch(fullPath, nestedSection, context.scanContext)
    return
  }

  if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
    const doc = await createSearchDocFromFile(entry.name, fullPath, {
      routesDir: context.scanContext.routesDir,
      section: context.section,
    })
    if (doc != null) {
      context.scanContext.docs.push(doc)
    }
  }
}

async function createSearchDocFromFile(
  fileName: string,
  filePath: string,
  context: SearchDocBuildContext
): Promise<null | SearchDoc> {
  const fileContent = await fs.readFile(filePath, "utf8")
  const parsed = matter<{ title?: unknown }>(fileContent)
  const extension = fileName.endsWith(".mdx") ? ".mdx" : ".md"
  const title =
    typeof parsed.data.title === "string"
      ? parsed.data.title
      : formatTitle(fileName.replace(extension, ""))

  const relativePath = path.relative(context.routesDir, filePath)
  const routePath = buildRoutePath(relativePath, fileName, extension)
  const content = sanitizeSearchContent(parsed.content)

  return {
    id: relativePath,
    title,
    content,
    path: routePath,
    section: context.section,
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

function buildRoutePath(relativePath: string, fileName: string, extension: string): string {
  if (fileName === "index.mdx" || fileName === "index.md") {
    const directoryPath = path.dirname(relativePath).replaceAll("\\", "/")
    return directoryPath === "." ? "/" : `/${directoryPath}`
  }

  return `/${relativePath.replace(extension, "").replaceAll("\\", "/")}`
}

function createNestedSection(section: string | undefined, directoryName: string): string {
  const currentTitle = formatTitle(directoryName)
  return section != null ? `${section} > ${currentTitle}` : currentTitle
}

function formatTitle(name: string): string {
  return name.replaceAll(/[_-]/g, " ").replaceAll(/\b\w/g, (char) => char.toUpperCase())
}
