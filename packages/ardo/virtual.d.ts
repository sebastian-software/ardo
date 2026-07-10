/**
 * Ambient module declarations for Ardo virtual modules.
 *
 * These types are automatically available when importing from
 * `virtual:ardo/config` or `virtual:ardo/search-index`.
 *
 * To use, add to your tsconfig.json:
 * ```json
 * { "compilerOptions": { "types": ["ardo/virtual"] } }
 * ```
 *
 * Or add a triple-slash reference in any .d.ts file:
 * ```ts
 * /// <reference types="ardo/virtual" />
 * ```
 */

declare module "virtual:ardo/config" {
  import type { ArdoConfig } from "ardo"
  const config: ArdoConfig
  export default config
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

declare module "virtual:ardo/collections" {
  import type { CollectionEntry } from "ardo/vite"

  const collections: Record<string, CollectionEntry[]>
  export function getCollection<TData = Record<string, unknown>>(
    name: string
  ): CollectionEntry<TData>[]
  export default collections
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
