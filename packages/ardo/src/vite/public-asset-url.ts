import { existsSync, realpathSync, statSync } from "node:fs"
import path from "node:path"

import { isPathInsideDirectory } from "./path-utils"

/** Vite's asset resolver keeps public URLs unchanged during watcher graph lookups. */
export function isPublicAssetUrl(id: string, resolvedId: string, publicDir: string): boolean {
  if (!publicDir || id !== resolvedId || !id.startsWith("/") || id.startsWith("//")) return false
  const url = id.split(/[?#]/u, 1)[0]
  // A real absolute source path still needs the normal package ownership check.
  if (existsSync(url)) return false
  const file = path.join(publicDir, url)
  if (!isPathInsideDirectory(file, publicDir)) return false
  try {
    return (
      statSync(file).isFile() && isPathInsideDirectory(realpathSync(file), realpathSync(publicDir))
    )
  } catch {
    // A public file may disappear while a filesystem event is being handled.
    return false
  }
}
