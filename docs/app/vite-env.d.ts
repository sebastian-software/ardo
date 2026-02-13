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

declare module "*.mdx" {
  import type { ComponentType } from "react"
  import type { PageFrontmatter, TOCItem } from "ardo"

  export const frontmatter: PageFrontmatter
  export const toc: TOCItem[]
  const component: ComponentType
  export default component
}

declare module "*.md" {
  import type { ComponentType } from "react"
  import type { PageFrontmatter, TOCItem } from "ardo"

  export const frontmatter: PageFrontmatter
  export const toc: TOCItem[]
  const component: ComponentType
  export default component
}
