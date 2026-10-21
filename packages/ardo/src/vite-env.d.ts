/// <reference types="vite/client" />

declare const __BUILD_TIME__: string

declare module "virtual:ardo/config" {
  import type { ArdoConfig } from "./config/types"

  const config: ArdoConfig
  export default config
}

declare module "virtual:ardo/generated-sidebars" {
  import type { SidebarItem } from "./config/types"

  const sidebars: Record<string, SidebarItem[]>
  export default sidebars
  /** Index-page route per section folder that has one, keyed like the sidebars. */
  export const sectionIndexes: Record<string, string>
}

declare module "virtual:ardo/search-index" {
  interface SearchDoc {
    id: string
    title: string
    pageTitle: string
    content: string
    excerpt: string
    path: string
    publicPath: string
    routePath: string
    anchor?: string
    headingHierarchy: string[]
    localeId?: string
    routeGroup?: string
    section?: string
    versionId?: string
  }
  const searchDocs: SearchDoc[]
  export default searchDocs
}

declare module "virtual:ardo/routes" {
  import type { ArdoRootModule, ArdoRouteEntry } from "./runtime/routing"

  /** `app/root.tsx`. */
  export const rootModule: ArdoRootModule
  /** Every page route, loaded lazily so each page gets its own chunk. */
  export const routes: ArdoRouteEntry[]
}
