import type { NativeApiDocsConfig } from "./types"

type EntryPoints = NativeApiDocsConfig["entryPoints"]

/** Entry point files in configuration order. */
export function entryPointFiles(entryPoints: EntryPoints): string[] {
  return Array.isArray(entryPoints) ? [...entryPoints] : Object.values(entryPoints)
}

/** Import path of each entry point file, in the same order, when the config names them. */
export function entryPointImportPaths(entryPoints: EntryPoints): string[] {
  return Array.isArray(entryPoints) ? [] : Object.keys(entryPoints)
}

/** Map entry point files, keeping their import paths. */
export function mapEntryPointFiles(
  entryPoints: EntryPoints,
  map: (file: string) => string
): EntryPoints {
  if (Array.isArray(entryPoints)) return entryPoints.map((file) => map(file))
  return Object.fromEntries(
    Object.entries(entryPoints).map(([importPath, file]) => [importPath, map(file)])
  )
}
