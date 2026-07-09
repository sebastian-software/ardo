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
}

declare module "virtual:ardo/search-index" {
  interface SearchDoc {
    id: string
    title: string
    content: string
    path: string
    publicPath: string
    routePath: string
    localeId?: string
    section?: string
    versionId?: string
  }
  const searchDocs: SearchDoc[]
  export default searchDocs
}
