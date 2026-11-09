import { readFileSync } from "node:fs"
import path from "node:path"
import { normalizePath } from "./path-utils"
import type { RouteManifestEntry } from "./route-manifest"

/** Reuse the client build's metadata scan, including native plain-text H1 headings. */
export function collectShareImageTitles(
  entries: readonly RouteManifestEntry[],
  root: string
): Map<string, string> {
  return new Map(
    entries
      .filter((entry) => entry.source === "markdown")
      .map((entry) => [
        normalizePath(path.relative(root, entry.filePath)),
        shareImageTitle({
          title: entry.metadata.title,
          fallback: entry.headings?.find((heading) => heading.level === 1)?.text,
          file: entry.filePath,
        }),
      ])
  )
}

/** Explicit title, then a native heading, then the same filename spelling used by search. */
export function shareImageTitle(input: {
  title?: unknown
  fallback?: string
  file: string
}): string {
  if (typeof input.title === "string" && input.title.trim() !== "") return input.title.trim()
  if (input.fallback != null && input.fallback.trim() !== "") return input.fallback.trim()
  return path
    .basename(input.file, path.extname(input.file))
    .replaceAll(/[_-]/gu, " ")
    .replaceAll(/\b\w/gu, (char) => char.toUpperCase())
}

const TITLE_MANIFEST = ".vite/ardo-share-image-titles.json"

/** Environment plugins do not share mutable state; carry titles in the existing build-artifact lifecycle. */
export function createShareImageTitleAsset(
  entries: readonly RouteManifestEntry[],
  root: string
): { type: "asset"; fileName: string; source: string } {
  return {
    type: "asset",
    fileName: TITLE_MANIFEST,
    source: JSON.stringify([...collectShareImageTitles(entries, root)]),
  }
}

/** Read once before prerender. Existing .vite manifest cleanup removes this internal build artifact. */
export function readShareImageTitles(clientDir: string): ReadonlyMap<string, string> {
  const entries: unknown = JSON.parse(readFileSync(path.join(clientDir, TITLE_MANIFEST), "utf8"))
  if (!Array.isArray(entries) || !entries.every((entry) => isTitleEntry(entry)))
    throw new Error("[ardo] Invalid share-image title manifest.")
  return new Map(entries)
}

function isTitleEntry(entry: unknown): entry is [string, string] {
  return (
    Array.isArray(entry) && entry.length === 2 && entry.every((value) => typeof value === "string")
  )
}
