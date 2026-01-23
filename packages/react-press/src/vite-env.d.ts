/// <reference types="vite/client" />

declare module 'virtual:react-press/config' {
  import type { PressConfig } from './config/types'
  const config: PressConfig
  export default config
}

declare module 'virtual:react-press/sidebar' {
  import type { SidebarItem } from './config/types'
  const sidebar: SidebarItem[]
  export default sidebar
}
