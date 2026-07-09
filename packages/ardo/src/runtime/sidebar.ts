import type { ResolvedConfig, SidebarItem } from "../config/types"

import { createRouteManifestOptions } from "../vite/route-manifest"
import { generateSidebar as generateViteSidebar } from "../vite/sidebar-index"

export type SidebarGenerationOptions = {
  basePath: string
  config: ResolvedConfig
  contentDir: string
}

/**
 * @deprecated Use `<ArdoGeneratedSidebar />` inside your JSX sidebar instead.
 * This compatibility wrapper now delegates to the same sidebar generator used
 * by the Vite integration.
 */
export async function generateSidebar(options: SidebarGenerationOptions): Promise<SidebarItem[]> {
  return generateViteSidebar(options.contentDir, {
    ...options.config.sidebar,
    ...createRouteManifestOptions({
      base: options.basePath,
      i18n: options.config.i18n,
      versioning: options.config.versioning,
    }),
  })
}
