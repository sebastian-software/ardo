import path from "node:path"

import type { RouteManifestOptions } from "./route-manifest"

import {
  createSidebarRouteIdentity,
  readDirectoryEntries,
  readDirectoryIndexMetadata,
  toSidebarRouteFields,
} from "./sidebar-index"

/**
 * Landing route for each top-level section folder that has its own index
 * page, keyed like `generateContextSidebars` (`section` or `locale:section`).
 * The generated sidebar lists a folder's children only, so without this the
 * section tab would land on the first child instead of the overview.
 */
export async function generateContextSectionIndexes(
  routesDir: string,
  options: RouteManifestOptions = {}
): Promise<Record<string, string>> {
  const localeIds = options.localeIds ?? []
  if (localeIds.length === 0) return sectionIndexesIn(routesDir, options)

  const indexes: Record<string, string> = {}
  for (const localeId of localeIds) {
    const localized = await sectionIndexesIn(
      path.join(routesDir, localeId),
      { ...options, localeId, localeIds: undefined },
      localeId
    )
    for (const [section, link] of Object.entries(localized)) {
      indexes[`${localeId}:${section}`] = link
    }
  }
  return indexes
}

async function sectionIndexesIn(
  dir: string,
  options: RouteManifestOptions,
  localeId?: string
): Promise<Record<string, string>> {
  const indexes: Record<string, string> = {}
  for (const entry of await readDirectoryEntries(dir)) {
    if (!entry.isDirectory()) continue
    if ((await readDirectoryIndexMetadata(path.join(dir, entry.name), options.markdown)) == null)
      continue
    const identity = createSidebarRouteIdentity(entry.name, options)
    const { link } = toSidebarRouteFields(identity, localeId)
    if (link != null) indexes[entry.name] = link
  }
  return indexes
}
