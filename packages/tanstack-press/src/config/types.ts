import type { BundledTheme } from 'shiki'

export interface SidebarItem {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

export interface NavItem {
  text: string
  link?: string
  items?: NavItem[]
  activeMatch?: string
}

export interface SocialLink {
  icon: 'github' | 'twitter' | 'discord' | 'linkedin' | 'youtube' | 'npm'
  link: string
  ariaLabel?: string
}

export interface ThemeConfig {
  logo?: string | { light: string; dark: string }
  siteTitle?: string | false
  nav?: NavItem[]
  sidebar?: SidebarItem[] | Record<string, SidebarItem[]>
  socialLinks?: SocialLink[]
  footer?: {
    message?: string
    copyright?: string
  }
  search?: {
    enabled?: boolean
    placeholder?: string
  }
  editLink?: {
    pattern: string
    text?: string
  }
  lastUpdated?: {
    enabled?: boolean
    text?: string
    formatOptions?: Intl.DateTimeFormatOptions
  }
  outline?: {
    level?: number | [number, number]
    label?: string
  }
}

export interface MarkdownConfig {
  theme?: BundledTheme | { light: BundledTheme; dark: BundledTheme }
  lineNumbers?: boolean
  anchor?: boolean
  toc?: {
    level?: [number, number]
  }
  remarkPlugins?: unknown[]
  rehypePlugins?: unknown[]
}

export interface HeadConfig {
  tag: string
  attrs?: Record<string, string | boolean>
  children?: string
}

export interface TypeDocConfig {
  enabled?: boolean
  entryPoints: string[]
  tsconfig?: string
  out?: string
  readme?: string | 'none'
  plugin?: string[]
  exclude?: string[]
  excludeExternals?: boolean
  excludePrivate?: boolean
  excludeProtected?: boolean
  excludeInternal?: boolean
  sort?: Array<
    | 'source-order'
    | 'alphabetical'
    | 'enum-value-ascending'
    | 'enum-value-descending'
    | 'required-first'
    | 'visibility'
  >
  categoryOrder?: string[]
  groupOrder?: string[]
  watch?: boolean
  sidebar?: {
    title?: string
    position?: number
    collapsed?: boolean
  }
  markdown?: {
    breadcrumbs?: boolean
    hierarchy?: boolean
    sourceLinks?: boolean
    sourceBaseUrl?: string
    codeBlocks?: boolean
  }
}

export interface PressConfig {
  title: string
  description?: string
  base?: string
  srcDir?: string
  outDir?: string
  lang?: string
  head?: HeadConfig[]
  themeConfig?: ThemeConfig
  markdown?: MarkdownConfig
  typedoc?: TypeDocConfig
  vite?: Record<string, unknown>
}

export interface PageFrontmatter {
  title?: string
  description?: string
  layout?: 'doc' | 'home' | 'page'
  sidebar?: boolean
  outline?: boolean | number | [number, number]
  editLink?: boolean
  lastUpdated?: boolean
  prev?: string | { text: string; link: string } | false
  next?: string | { text: string; link: string } | false
  hero?: {
    name?: string
    text?: string
    tagline?: string
    image?: string | { light: string; dark: string }
    actions?: Array<{
      text: string
      link: string
      theme?: 'brand' | 'alt'
    }>
  }
  features?: Array<{
    icon?: string
    title: string
    details: string
    link?: string
    linkText?: string
  }>
}

export interface TOCItem {
  id: string
  text: string
  level: number
  children?: TOCItem[]
}

export interface PageData {
  title: string
  description?: string
  frontmatter: PageFrontmatter
  content: string
  toc: TOCItem[]
  lastUpdated?: number
  filePath: string
  relativePath: string
}

export interface ResolvedConfig extends Required<Omit<PressConfig, 'vite' | 'typedoc'>> {
  vite?: Record<string, unknown>
  typedoc?: TypeDocConfig
  root: string
  contentDir: string
}
