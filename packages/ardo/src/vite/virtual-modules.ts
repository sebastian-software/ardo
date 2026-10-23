import type { ResolvedConfig } from "../config/types"
import type { CollectionsConfig } from "./collections"

import { readCollections } from "./collections"
import { detectGitHash } from "./git-utils"
import { createRouteManifestOptions } from "./route-manifest"
import { generateSearchIndex } from "./search-index"
import { generateContextSidebars } from "./sidebar-index"
import { generateContextSectionIndexes } from "./sidebar-section-indexes"

export const VIRTUAL_MODULE_ID = "virtual:ardo/config"
export const VIRTUAL_GENERATED_SIDEBARS_ID = "virtual:ardo/generated-sidebars"
export const VIRTUAL_SEARCH_ID = "virtual:ardo/search-index"
export const VIRTUAL_COLLECTIONS_ID = "virtual:ardo/collections"

export const RESOLVED_IDS: Record<string, string> = {
  [VIRTUAL_MODULE_ID]: `\0${VIRTUAL_MODULE_ID}`,
  [VIRTUAL_GENERATED_SIDEBARS_ID]: `\0${VIRTUAL_GENERATED_SIDEBARS_ID}`,
  [VIRTUAL_SEARCH_ID]: `\0${VIRTUAL_SEARCH_ID}`,
  [VIRTUAL_COLLECTIONS_ID]: `\0${VIRTUAL_COLLECTIONS_ID}`,
}

export type ArdoVirtualModuleState = {
  collections?: CollectionsConfig
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

export function resolveVirtualModuleId(id: string): string | undefined {
  return RESOLVED_IDS[id]
}

export async function loadVirtualModule(
  id: string,
  state: ArdoVirtualModuleState
): Promise<string | undefined> {
  if (state.resolvedConfig == null) {
    return undefined
  }

  if (id === RESOLVED_IDS[VIRTUAL_MODULE_ID]) {
    const clientConfig = {
      title: state.resolvedConfig.title,
      description: state.resolvedConfig.description,
      base: state.resolvedConfig.base,
      deploymentBase: state.resolvedConfig.deploymentBase,
      lang: state.resolvedConfig.lang,
      versioning: state.resolvedConfig.versioning,
      sidebar: state.resolvedConfig.sidebar,
      i18n: state.resolvedConfig.i18n,
      project: state.resolvedConfig.project,
      buildTime: new Date().toISOString(),
      buildHash: detectGitHash(state.resolvedConfig.root),
    }
    return `export default ${JSON.stringify(clientConfig)}`
  }

  if (id === RESOLVED_IDS[VIRTUAL_GENERATED_SIDEBARS_ID]) {
    return generatedSidebarsModule(
      state.routesDir,
      createRouteManifestOptions(state.resolvedConfig)
    )
  }

  if (id === RESOLVED_IDS[VIRTUAL_SEARCH_ID]) {
    const searchIndex = await generateSearchIndex(
      state.routesDir,
      createRouteManifestOptions(state.resolvedConfig)
    )
    return `export default ${JSON.stringify(searchIndex)}`
  }

  if (id === RESOLVED_IDS[VIRTUAL_COLLECTIONS_ID]) {
    const collections = await readCollections({
      collections: state.collections,
      root: state.resolvedConfig.root,
    })
    return `export const collections = ${JSON.stringify(collections)}; export function getCollection(name) { return collections[name] ?? []; } export default collections;`
  }

  return undefined
}

async function generatedSidebarsModule(
  routesDir: string,
  options: ReturnType<typeof createRouteManifestOptions>
): Promise<string> {
  const sidebars = await generateContextSidebars(routesDir, options)
  const sectionIndexes = await generateContextSectionIndexes(routesDir, options)
  return `export default ${JSON.stringify(sidebars)}; export const sectionIndexes = ${JSON.stringify(sectionIndexes)}`
}
