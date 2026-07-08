import type { ResolvedConfig, SidebarItem } from "../config/types"

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
  return generateViteSidebar(options.contentDir, options.config.sidebar)
}
