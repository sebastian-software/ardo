import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"

import type { ContentSourceMapping } from "./content-sources"

export type CollectionEntry<TData = Record<string, unknown>> = {
  data: TData
  sourcePath: string
}

export type CollectionDefinition<TData = Record<string, unknown>> = {
  /** Local Markdown/MDX file or directory, relative to the project root. */
  from: string
  /** Generated route prefix, relative to app/routes. */
  to: string
  /** Optional build-time parser for collection-specific frontmatter. */
  schema?: (data: Record<string, unknown>) => TData
}

export type CollectionsConfig = Record<string, CollectionDefinition>

export function defineCollection<TData>(
  definition: CollectionDefinition<TData>
): CollectionDefinition<TData> {
  return definition
}

export function createCollectionContentSources(
  collections: CollectionsConfig | undefined
): ContentSourceMapping[] {
  if (collections == null) return []
  return Object.values(collections).map(({ from, to }) => ({ from, to }))
}

export async function readCollections(input: {
  collections: CollectionsConfig | undefined
  root: string
}): Promise<Record<string, CollectionEntry[]>> {
  const result: Record<string, CollectionEntry[]> = {}
  for (const [name, definition] of Object.entries(input.collections ?? {})) {
    const entries = await readCollection(path.resolve(input.root, definition.from), definition)
    result[name] = entries.map((entry) => ({
      ...entry,
      sourcePath: path.relative(input.root, entry.sourcePath).replaceAll("\\", "/"),
    }))
  }
  return result
}

async function readCollection(
  sourcePath: string,
  definition: CollectionDefinition
): Promise<CollectionEntry[]> {
  const stat = await fs.stat(sourcePath)
  const files = stat.isDirectory() ? await readMarkdownFiles(sourcePath) : [sourcePath]
  const entries: CollectionEntry[] = []

  for (const filePath of files) {
    if (!isMarkdownFile(filePath)) continue
    const parsed = matter(await fs.readFile(filePath, "utf8"))
    const data = toRecord(parsed.data)
    try {
      entries.push({
        data: definition.schema == null ? data : definition.schema(data),
        sourcePath: filePath,
      })
    } catch (error) {
      throw new Error(
        `[ardo] Failed to validate collection entry ${filePath}: ${formatUnknownError(error)}`
      )
    }
  }

  return entries
}

async function readMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? readMarkdownFiles(entryPath) : [entryPath]
    })
  )
  return nested.flat().sort()
}

function isMarkdownFile(filePath: string): boolean {
  return filePath.endsWith(".md") || filePath.endsWith(".mdx")
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value) ? { ...value } : {}
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
