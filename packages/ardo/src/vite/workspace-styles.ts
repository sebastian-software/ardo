import { existsSync, realpathSync } from "node:fs"

import { isPathInsideDirectory, normalizePath } from "./path-utils"

const sourcePattern = /\.css\.(?:js|cjs|mjs|jsx|ts|tsx)$/u
const generatedSuffix = ".vanilla.css"

/** Vanilla Extract lifts dependency CSS imports into its consuming style module. */
export function isGeneratedWorkspaceStyleImport(
  file: string,
  {
    importer,
    packageRoot,
    watchedFiles = [],
  }: {
    importer: string | undefined
    packageRoot: string
    watchedFiles?: readonly string[]
  }
): boolean {
  const sourceImporter = importer?.split("?", 1)[0]
  if (sourceImporter == null || !sourcePattern.test(sourceImporter)) return false
  const source = file.endsWith(generatedSuffix)
    ? file.slice(0, -generatedSuffix.length)
    : watchedFiles.some((watched) => normalizePath(watched) === normalizePath(file))
      ? file
      : undefined
  return (
    source != null &&
    sourcePattern.test(source) &&
    existsSync(sourceImporter) &&
    existsSync(source) &&
    isPathInsideDirectory(realpathSync(source), packageRoot)
  )
}
