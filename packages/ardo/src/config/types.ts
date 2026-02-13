import type { BundledTheme } from "shiki"

// =============================================================================
// Sidebar Types (for data-driven sidebar)
// =============================================================================

export interface SidebarItem {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

// =============================================================================
// Navigation Types (for data-driven nav)
// =============================================================================

export interface NavItem {
  text: string
  link?: string
  items?: NavItem[]
  activeMatch?: string
}

// =============================================================================
// Sponsor Types
// =============================================================================

export interface SponsorConfig {
  text: string
  link: string
}

// =============================================================================
// Social Link Types
// =============================================================================

export interface SocialLink {
  icon: "github" | "twitter" | "discord" | "linkedin" | "youtube" | "npm"
  link: string
  ariaLabel?: string
}

// =============================================================================
// Theme Config (Runtime UI configuration)
// =============================================================================

/**
 * Theme configuration for backwards compatibility with config-driven approach.
 * In JSX-first architecture, most of these settings are passed directly
 * as props to the components instead.
 */
export interface ThemeConfig {
  /** Logo image URL or light/dark variants */
  logo?: string | { light: string; dark: string }
  /** Site title (set to false to hide) */
  siteTitle?: string | false
  /** Navigation items (deprecated: use <Nav> component instead) */
  nav?: NavItem[]
  /** Sidebar configuration (deprecated: use <Sidebar> component instead) */
  sidebar?: SidebarItem[] | Record<string, SidebarItem[]>
  /** Social links (deprecated: use <SocialLink> component instead) */
  socialLinks?: SocialLink[]
  /** Footer configuration (deprecated: use <Footer> component instead) */
  footer?: {
    message?: string
    copyright?: string
    sponsor?: SponsorConfig
  }
  /** Search configuration */
  search?: {
    enabled?: boolean
    placeholder?: string
  }
  /** Edit link configuration */
  editLink?: {
    pattern: string
    text?: string
  }
  /** Last updated configuration */
  lastUpdated?: {
    enabled?: boolean
    text?: string
    formatOptions?: Intl.DateTimeFormatOptions
  }
  /** Table of contents configuration */
  outline?: {
    level?: number | [number, number]
    label?: string
  }
}

// =============================================================================
// Markdown Config
// =============================================================================

export interface MarkdownConfig {
  /** Syntax highlighting theme */
  theme?: BundledTheme | { light: BundledTheme; dark: BundledTheme }
  /** Show line numbers in code blocks */
  lineNumbers?: boolean
  /** Enable anchor links for headings */
  anchor?: boolean
  /** Table of contents configuration */
  toc?: {
    level?: [number, number]
  }
  /** Remark plugins */
  remarkPlugins?: unknown[]
  /** Rehype plugins */
  rehypePlugins?: unknown[]
}

// =============================================================================
// Head Config
// =============================================================================

export interface HeadConfig {
  tag: string
  attrs?: Record<string, string | boolean>
  children?: string
}

// =============================================================================
// TypeDoc Config
// =============================================================================

export interface TypeDocConfig {
  enabled?: boolean
  entryPoints: string[]
  tsconfig?: string
  out?: string
  readme?: string | "none"
  plugin?: string[]
  exclude?: string[]
  excludeExternals?: boolean
  excludePrivate?: boolean
  excludeProtected?: boolean
  excludeInternal?: boolean
  sort?: Array<
    | "source-order"
    | "alphabetical"
    | "enum-value-ascending"
    | "enum-value-descending"
    | "required-first"
    | "visibility"
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

// =============================================================================
// Project Metadata (auto-detected from package.json)
// =============================================================================

export interface ProjectMeta {
  /** Package name from package.json */
  name?: string
  /** Homepage URL from package.json */
  homepage?: string
  /** Repository URL (resolved from package.json repository field) */
  repository?: string
  /** Package version */
  version?: string
  /** Package author */
  author?: string
  /** Package license */
  license?: string
}

// =============================================================================
// Ardo Config (Main Configuration)
// =============================================================================

/**
 * Main Ardo configuration.
 *
 * In JSX-first architecture, only build-time options are needed here.
 * Runtime UI configuration (header, sidebar, footer) is done in JSX.
 */
export interface ArdoConfig {
  /** Site title (used for default meta tags) */
  title: string
  /** Site description (used for default meta tags) */
  description?: string
  /** Separator between page title and site title (default: " | ") */
  titleSeparator?: string
  /** Base URL path */
  base?: string
  /** Content source directory (default: 'content') */
  srcDir?: string
  /** Build output directory (default: 'dist') */
  outDir?: string
  /** Site language (default: 'en') */
  lang?: string
  /** Additional head tags (deprecated: use React Router Meta instead) */
  head?: HeadConfig[]
  /**
   * Theme configuration for backwards compatibility.
   * Prefer using JSX components with props instead.
   */
  themeConfig?: ThemeConfig
  /** Markdown processing options */
  markdown?: MarkdownConfig
  /**
   * TypeDoc API documentation generation.
   * - `true`: Enable with defaults (./src/index.ts → content/api-reference/)
   * - `{ ... }`: Enable with custom config
   */
  typedoc?: true | TypeDocConfig
  /** Custom Vite configuration */
  vite?: Record<string, unknown>
  /**
   * Project metadata (auto-detected from package.json if not provided).
   * Available at runtime via `config.project` from `virtual:ardo/config`.
   */
  project?: ProjectMeta
  /** Build timestamp (ISO string, set automatically by the Vite plugin) */
  buildTime?: string
  /** Git commit hash (set automatically by the Vite plugin) */
  buildHash?: string
}

// =============================================================================
// Page Types
// =============================================================================

export interface PageFrontmatter {
  title?: string
  description?: string
  layout?: "doc" | "home" | "page"
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
      theme?: "brand" | "alt"
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

// =============================================================================
// Resolved Config (Internal)
// =============================================================================

export interface ResolvedConfig extends Required<
  Omit<ArdoConfig, "vite" | "typedoc" | "project" | "buildTime" | "buildHash">
> {
  project: ProjectMeta
  vite?: Record<string, unknown>
  typedoc?: TypeDocConfig
  root: string
  contentDir: string
}
