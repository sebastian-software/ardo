/// <reference types="vite/client" />

declare const __BUILD_TIME__: string

declare module "virtual:ardo/config" {
  import type { PressConfig } from "./config/types"
  const config: PressConfig & { buildTime: string }
  export default config
}

declare module "virtual:ardo/sidebar" {
  import type { SidebarItem } from "./config/types"
  const sidebar: SidebarItem[]
  export default sidebar
}

declare module "virtual:ardo/search-index" {
  interface SearchDoc {
    id: string
    title: string
    content: string
    path: string
    section?: string
  }
  const searchDocs: SearchDoc[]
  export default searchDocs
}
