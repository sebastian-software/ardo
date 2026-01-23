/// <reference types="vite/client" />

declare module 'virtual:react-press/config' {
  import type { PressConfig } from 'react-press'
  const config: PressConfig
  export default config
}

declare module 'virtual:react-press/sidebar' {
  import type { SidebarItem } from 'react-press'
  const sidebar: SidebarItem[]
  export default sidebar
}

declare module '*.md' {
  import type { ComponentType } from 'react'
  import type { PageFrontmatter, TOCItem } from 'react-press'

  export const frontmatter: PageFrontmatter
  export const toc: TOCItem[]
  const component: ComponentType
  export default component
}
