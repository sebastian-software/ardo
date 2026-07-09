import type { ResolvedConfig } from "../config/types"

import { serializeVirtualConfigModule } from "./brand"
import { detectGitHash } from "./git-utils"
import { createRouteManifestOptions } from "./route-manifest"
import { generateSearchIndex } from "./search-index"
import { generateContextSidebars } from "./sidebar-index"

export const VIRTUAL_MODULE_ID = "virtual:ardo/config"
export const VIRTUAL_GENERATED_SIDEBARS_ID = "virtual:ardo/generated-sidebars"
export const VIRTUAL_SEARCH_ID = "virtual:ardo/search-index"

export const RESOLVED_IDS: Record<string, string> = {
  [VIRTUAL_MODULE_ID]: `\0${VIRTUAL_MODULE_ID}`,
  [VIRTUAL_GENERATED_SIDEBARS_ID]: `\0${VIRTUAL_GENERATED_SIDEBARS_ID}`,
  [VIRTUAL_SEARCH_ID]: `\0${VIRTUAL_SEARCH_ID}`,
}

export type ArdoVirtualModuleState = {
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
      lang: state.resolvedConfig.lang,
      brand: state.resolvedConfig.brand,
      project: state.resolvedConfig.project,
      buildTime: new Date().toISOString(),
      buildHash: detectGitHash(state.resolvedConfig.root),
    }
    return serializeVirtualConfigModule(clientConfig, state.resolvedConfig.root)
  }

  if (id === RESOLVED_IDS[VIRTUAL_GENERATED_SIDEBARS_ID]) {
    const sidebars = await generateContextSidebars(state.routesDir)
    return `export default ${JSON.stringify(sidebars)}`
  }

  if (id === RESOLVED_IDS[VIRTUAL_SEARCH_ID]) {
    const searchIndex = await generateSearchIndex(
      state.routesDir,
      createRouteManifestOptions(state.resolvedConfig)
    )
    return `export default ${JSON.stringify(searchIndex)}`
  }

  return undefined
}
