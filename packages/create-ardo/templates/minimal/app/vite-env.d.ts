/// <reference types="vite/client" />

declare module "virtual:ardo/config" {
  import type { ArdoConfig } from "ardo"
  const config: ArdoConfig
  export default config
}

declare module "virtual:ardo/sidebar" {
  import type { SidebarItem } from "ardo"
  const sidebar: SidebarItem[]
  export default sidebar
}
