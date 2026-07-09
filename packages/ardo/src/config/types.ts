import type { BundledTheme } from "shiki"
import type { PluggableList } from "unified"

// =============================================================================
// Sidebar Types (for data-driven sidebar)
// =============================================================================

export type SidebarItem = {
  text: string
  link?: string
  routePath?: string
  publicPath?: string
  versionId?: string
  localeId?: string
  icon?: "api" | "book" | "box" | "code" | "components" | "docs" | "guide" | "settings" | "tools"
  collapsed?: boolean
  items?: SidebarItem[]
}

export type SidebarConfig = {
  /** Top-level generated sidebar sections to prioritize by route segment. */
  sectionOrder?: string[]
}

// =============================================================================
// Sponsor Types
// =============================================================================

export type SponsorConfig = {
  text: string
  link: string
}

// =============================================================================
// Social Link Types
// =============================================================================

export type SocialLink = {
  icon: "discord" | "github" | "linkedin" | "npm" | "twitter" | "youtube"
  link: string
  ariaLabel?: string
}

// =============================================================================
// Brand Config
// =============================================================================

export type ArdoBrandHuePreset =
  | "amber"
  | "berry"
  | "blue"
  | "gray"
  | "green"
  | "indigo"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "slate"
  | "teal"

export type ArdoBrandHue = ArdoBrandHuePreset | number

export type ArdoBrandLogo = { light: string; dark: string } | string

export type ArdoBrandConfig = {
  /** Main brand hue used by primary accents and calls to action. */
  color?: ArdoBrandHue
  /** Accent hue used by secondary accents and code surfaces. Defaults from color. */
  accent?: ArdoBrandHue
  /** Neutral chrome hue used by backgrounds, borders, text, header, and sidebar. */
  neutral?: ArdoBrandHue
  /** Header logo path/URL, optionally with light/dark variants. */
  logo?: ArdoBrandLogo
}

// =============================================================================
// Markdown Config
// =============================================================================

export type MarkdownConfig = {
  /** Syntax highlighting theme */
  theme?: { light: BundledTheme; dark: BundledTheme } | BundledTheme
  /** Show line numbers in code blocks */
  lineNumbers?: boolean
  /** Enable anchor links for headings */
  anchor?: boolean
  /** Table of contents configuration */
  toc?: {
    level?: [number, number]
  }
  /** Remark plugins */
  remarkPlugins?: PluggableList
  /** Rehype plugins */
  rehypePlugins?: PluggableList
}

// =============================================================================
// Head Config
// =============================================================================

export type HeadConfig = {
  tag: string
  attrs?: Record<string, boolean | string>
  children?: string
}

// =============================================================================
// TypeDoc Config
// =============================================================================

export type TypeDocConfig = {
  enabled?: boolean
  entryPoints: string[]
  tsconfig?: string
  out?: string
  readme?: string
  plugin?: string[]
  exclude?: string[]
  excludeExternals?: boolean
  excludePrivate?: boolean
  excludeProtected?: boolean
  excludeInternal?: boolean
  sort?: Array<
    | "alphabetical"
    | "enum-value-ascending"
    | "enum-value-descending"
    | "required-first"
    | "source-order"
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

export type ProjectMeta = {
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
// Documentation Versioning
// =============================================================================

export type DocumentationVersion = {
  /** Stable version id, usually the major line such as "v3" or "v2". */
  id: string
  /** Human-readable label shown in the version switcher. Defaults to id. */
  label?: string
  /** Public path for this major documentation version, such as "/v3/". */
  path: string
}

export type DocumentationVersioningConfig = {
  /** Active documentation version id for this build. */
  current: string
  /** Major documentation versions available from the version switcher. */
  versions: DocumentationVersion[]
  /** Generate a static root redirect to the current version. Defaults to true. */
  rootRedirect?: boolean
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
export type ArdoConfig = {
  /** Site title (used for default meta tags) */
  title: string
  /** Site description (used for default meta tags) */
  description?: string
  /** Separator between page title and site title (default: " | ") */
  titleSeparator?: string
  /** Base URL path */
  base?: string
  /** Absolute site URL used for canonical and social metadata URLs */
  siteUrl?: string
  /** Content source directory (default: 'content') */
  srcDir?: string
  /** Build output directory (default: 'dist') */
  outDir?: string
  /** Site language (default: 'en') */
  lang?: string
  /** Additional head tags (deprecated: use React Router Meta instead) */
  head?: HeadConfig[]
  /** Markdown processing options */
  markdown?: MarkdownConfig
  /** Generated sidebar options */
  sidebar?: SidebarConfig
  /** Site-level social metadata defaults */
  metadata?: MetadataConfig
  /** Simple brand customization for the default theme and header logo. */
  brand?: ArdoBrandConfig
  /** Sitemap and robots.txt generation */
  seo?: SeoConfig
  /** Build-time internal link checking */
  linkCheck?: LinkCheckConfig
  /** Static redirect generation */
  redirects?: RedirectConfig[]
  /**
   * Major-version documentation routing.
   *
   * When enabled, Ardo treats `base` as the deployment root and appends the current
   * version path to build canonical URLs, sitemap entries, and runtime links.
   */
  versioning?: DocumentationVersioningConfig | false
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

export type MetadataConfig = {
  image?: string
  ogType?: string
  twitterCard?: "summary_large_image" | "summary"
  twitterSite?: string
}

export type SeoConfig = {
  llms?: boolean | LlmsConfig
  sitemap?: boolean | SitemapConfig
  robots?: boolean | RobotsConfig
}

export type LlmsConfig = {
  /** File name for the concise LLM documentation index. */
  indexFileName?: string
  /** File name for the full LLM documentation export. */
  fullFileName?: string
  /** Generate the full documentation export next to the concise index. */
  includeFull?: boolean
  /** Override the generated document title. Defaults to the site title. */
  title?: string
  /** Override the generated document summary. Defaults to the site description. */
  description?: string
}

export type SitemapConfig = {
  changefreq?: SitemapChangefreq
  priority?: number
}

export type SitemapChangefreq =
  | "always"
  | "daily"
  | "hourly"
  | "monthly"
  | "never"
  | "weekly"
  | "yearly"

export type RobotsConfig = {
  allow?: string[]
  disallow?: string[]
}

export type LinkCheckConfig = {
  checkAnchors?: boolean
  enabled?: boolean
  exclude?: string[]
  level?: "error" | "warn"
}

export type RedirectConfig = {
  from: string
  to: string
}

// =============================================================================
// Page Types
// =============================================================================

export type PageFrontmatter = {
  title?: string
  description?: string
  canonical?: string
  ogDescription?: string
  ogImage?: string
  ogTitle?: string
  ogType?: string
  twitterCard?: "summary_large_image" | "summary"
  twitterDescription?: string
  twitterImage?: string
  twitterTitle?: string
  order?: number
  collapsed?: boolean
  layout?: "doc" | "home" | "page"
  sidebar?: boolean
  outline?: [number, number] | boolean | number
  editLink?: boolean
  lastUpdated?: boolean
  sitemap?: boolean
  /** Set to false to use description only as metadata, not as visible page lede. */
  lede?: boolean
  llms?: boolean
  redirectFrom?: string | string[]
  prev?: { text: string; link: string } | false | string
  next?: { text: string; link: string } | false | string
  hero?: {
    name?: string
    text?: string
    tagline?: string
    image?: { light: string; dark: string } | string
    actions?: Array<{
      text: string
      link: string
      theme?: "alt" | "brand"
    }>
  }
  features?: Array<{
    icon?: string
    title: string
    details: string
    link?: string
    linkText?: string
  }>
} & Record<string, unknown>

export type TOCItem = {
  id: string
  text: string
  level: number
  children?: TOCItem[]
}

export type PageData = {
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

export type ResolvedConfig = {
  project: ProjectMeta
  vite?: Record<string, unknown>
  typedoc?: TypeDocConfig
  root: string
  contentDir: string
} & Required<Omit<ArdoConfig, "buildHash" | "buildTime" | "project" | "typedoc" | "vite">>
