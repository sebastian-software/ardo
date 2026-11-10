import type { PackageOwner } from "./project-package-manifest"
import path from "node:path"
import { fileURLToPath } from "node:url"

export function absoluteFilePath(id: string): string | undefined {
  const cleanId = id.split("?", 1)[0]
  const file = cleanId.startsWith("file:") ? fileURLToPath(cleanId) : cleanId
  return path.isAbsolute(file) ? file : undefined
}

export type FileCheckOptions = {
  importer?: string
  managedName?: string
  managedSourcePath?: string
  styleWatchFiles?: readonly string[]
}

export type ManagedFileCheck = {
  canonical: string
  fileKey: string
  name: string
  sourcePath: string | undefined
}

export type FileOwnershipCheck = {
  file: string
  fileKey: string
  importer: string | undefined
  origin: PackageOwner
  resolvedSourcePath: string | undefined
  target: PackageOwner | undefined
  styleWatchFiles: readonly string[] | undefined
}
