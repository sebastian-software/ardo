import type { ImagesConfig, PostImage } from "../images/types"
import type { LintRuleId } from "./lint-rules"
import type { MarkdownConfig } from "./markdown"
import type { PostFrontmatter, PublicationConfig } from "../publication/types"

export type { MarkdownConfig } from "./markdown"

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
// Head Config
// =============================================================================

export type HeadConfig = {
  tag: string
  attrs?: Record<string, boolean | string>
  children?: string
}

export type OpenApiConfig = {
  /** Local OpenAPI 3.0/3.1 JSON or YAML file. Remote URLs are intentionally unsupported. */
  spec: string
  /** Generated route prefix. Defaults to `api`. */
  out?: string
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
  /** Supported URL locale prefixes. Empty means unlocalized; omitted preserves the current path. */
  locales?: string[]
  /** Public path for this major documentation version, such as "/v3/". */
  path: string
}

export type DocumentationVersioningConfig = {
  /** Complete route directories to version. Omit to retain legacy whole-site versioning. */
  directories?: string[]
  /** Active documentation version id for this build. */
  current: string
  /** Major documentation versions available from the version switcher. */
  versions: DocumentationVersion[]
  /** Generate a static root redirect to the current version. Defaults to true. */
  rootRedirect?: boolean
}

// =============================================================================
// i18n
// =============================================================================

export type DocumentationLocale = {
  /** Stable locale id used in canonical URLs, such as "en" or "de". */
  id: string
  /** Human-readable label for future locale switchers. Defaults to id. */
  label?: string
}

export type I18nConfig = {
  /** Default locale. When i18n is active, public URLs include this locale. */
  defaultLocale: string
  /** Redirect old unlocalized URLs to the default locale during a localization migration. */
  redirectUnlocalized?: boolean
  /** Locales that have their own complete static route tree. */
  locales: DocumentationLocale[]
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
  /** Shared local image processing; configuring it opts Markdown/MDX pages in. */
  images?: ImagesConfig
  /** Repository-authored news/blog posts, local author profiles, feeds, and images. */
  publication?: PublicationConfig
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
  /** Build output base directory, containing client/ and server/ (default: 'build') */
  outDir?: string
  /** Site language (default: 'en') */
  lang?: string
  /** Additional head tags (deprecated: export `meta` from the route or `app/root.tsx` instead) */
  head?: HeadConfig[]
  /** Markdown processing options */
  markdown?: MarkdownConfig
  /** Generated sidebar options */
  sidebar?: SidebarConfig
  /** Site-level social metadata defaults */
  metadata?: MetadataConfig
  /** Sitemap and robots.txt generation */
  seo?: SeoConfig
  /** Build-time internal link checking */
  linkCheck?: LinkCheckConfig
  /** Page transitions and speculative loading of linked pages */
  navigation?: NavigationConfig
  /** Static redirect generation */
  redirects?: RedirectConfig[]
  /**
   * Whether page URLs end with a slash (`/guide/`) or not (`/guide`). Applies to sitemap entries,
   * canonical and alternate links, internal links, and publication, post, tag, and feed URLs.
   * The dev server and `ardo preview` redirect the other spelling of a page to it; production
   * hosts must be configured to do the same (see the configuration guide). The site root keeps
   * its slash.
   *
   * Unset, Ardo keeps its earlier output: sitemap entries and default canonical links without
   * the slash, internal links and publication URLs with it, and both spellings are served.
   */
  trailingSlash?: boolean
  /** Build-time validation policy for content metadata. */
  validation?: ContentValidationConfig
  /**
   * Major-version documentation routing.
   *
   * When enabled, Ardo treats `base` as the deployment root and appends the current
   * version path to build canonical URLs, sitemap entries, and runtime links.
   */
  versioning?: DocumentationVersioningConfig | false
  /**
   * Strict static localization. Put each localized route under
   * `app/routes/<locale>/`; Ardo rejects missing or unlocalized pages rather
   * than serving an implicit fallback.
   */
  i18n?: false | I18nConfig
  /** Static OpenAPI 3.0/3.1 reference generation. */
  openapi?: OpenApiConfig
  /** Custom Vite configuration */
  vite?: Record<string, unknown>
  /**
   * Project metadata (auto-detected from package.json if not provided).
   * Available at runtime via `config.project` from `virtual:ardo/config`.
   */
  project?: ProjectMeta
  /**
   * Pins the build moment, for example so two language builds of one site agree on it. Opt-in:
   * without it, Ardo uses the current time as before.
   *
   * Must be an RFC 3339 timestamp with a time zone, such as `"2026-10-15T00:00:00Z"`; Ardo
   * normalizes it to UTC. When set, it decides which scheduled posts (with a future `publishedAt`)
   * the publication shows; posts with `draft: true` stay hidden regardless. It becomes
   * `config.buildTime` in `virtual:ardo/config` and the `__BUILD_TIME__` define. Ardo reads no
   * environment variable for it; map one in `ardo.config.ts` if needed.
   */
  buildTime?: string
  /**
   * The commit reference Ardo shows next to the build time, for example a CI commit hash. Opt-in:
   * without it, Ardo detects the short Git commit hash as before. Set `""` to show no hash; Ardo
   * then runs no Git command.
   *
   * The value is used as given and is published with the site. Ardo reads no environment variable
   * for it; map one in `ardo.config.ts` if needed. At runtime, `config.buildHash` from
   * `virtual:ardo/config` holds the configured or detected hash, is `""` when disabled, and is
   * absent when neither exists.
   */
  buildHash?: string
  /**
   * The project directory that this build's project mirrors, for a build that runs from a copy,
   * such as one staged copy per language. Ardo then reads Git history from the original files:
   * a route's last-updated date and sitemap `lastmod` use the last commit of the file at the same
   * path under `sourceRoot`, and the detected `buildHash` is that repository's commit. A file the
   * source does not have or Git does not track keeps the copy's file time, as without the option.
   * Relative paths resolve against the project root. Opt-in: without it, Ardo reads the history
   * of the project itself as before.
   */
  sourceRoot?: string
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
  /** Add a `TechArticle` JSON-LD block to Markdown pages when `siteUrl` is set. Default: true. */
  jsonLd?: boolean
  /**
   * Publish `skills/<name>/SKILL.md` folders at `/.well-known/agent-skills/`, with an index.
   * Set `false` to publish nothing. Requires a root deployment base.
   */
  agentSkills?: false | AgentSkillsConfig
  /**
   * Publish `/.well-known/ard.json` and `/.well-known/ai-catalog.json`, and link them from every
   * page. Needs `siteUrl` and a root deployment base. Default: true.
   */
  agentDiscovery?: boolean
}

export type AgentSkillsConfig = {
  /** Folder of skills, relative to the project root. Default: `skills`. */
  directory?: string
}

export type LlmsConfig = {
  /** File name for the concise LLM documentation index. */
  indexFileName?: string
  /** File name for the full LLM documentation export. */
  fullFileName?: string
  /** Generate the full documentation export next to the concise index. */
  includeFull?: boolean
  /**
   * Write one Markdown file per page at its URL with `.md` appended (`/guide/start.md`,
   * `/index.md` for a directory root) and link those from the index. Defaults to `true`.
   */
  pages?: boolean
  /** Override the generated document title. Defaults to the site title. */
  title?: string
  /** Override the generated document summary. Defaults to the site description. */
  description?: string
}

export type SitemapConfig = {
  /** Route path prefixes to omit, independent of deployment base, version, and locale. */
  exclude?: string[]
  changefreq?: SitemapChangefreq
  priority?: number
}

export type SitemapChangefreq =
  "always" | "daily" | "hourly" | "monthly" | "never" | "weekly" | "yearly"

export type RobotsConfig = {
  allow?: string[]
  disallow?: string[]
  /**
   * Content Signals policy (https://contentsignals.org) written as one `Content-Signal` line.
   * Only the signals you set appear. Nothing is written by default.
   */
  contentSignals?: ContentSignalsConfig
}

export type ContentSignalsConfig = {
  /** Search indexing. */
  search?: boolean
  /** Use of content as input to AI answers, such as retrieval. */
  aiInput?: boolean
  /** Use of content to train AI models. */
  aiTrain?: boolean
}

/** How the browser moves between pages. Every link still loads a full document. */
export type NavigationConfig = {
  /**
   * Cross-fade between pages with cross-document view transitions. Browsers without support,
   * and readers who prefer reduced motion, navigate without the animation.
   */
  viewTransitions?: boolean
  /**
   * Start loading a linked page while the pointer rests on its link, with the Speculation Rules
   * API. `"prefetch"` downloads the document; `"prerender"` also renders it. Production builds
   * only.
   */
  speculation?: false | "prefetch" | "prerender"
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
// Content validation
// =============================================================================

export type DiagnosticLevel = "error" | "ignore" | "warn"

export type FrontmatterValidationConfig = {
  /** How to report unsupported frontmatter keys. Defaults to `ignore` for compatibility. */
  unknown?: DiagnosticLevel
  /** How to report known frontmatter keys with an invalid value. Defaults to `warn`. */
  invalid?: DiagnosticLevel
}

export type ContentValidationConfig = {
  /** Validation policy for Markdown and MDX page frontmatter. */
  frontmatter?: FrontmatterValidationConfig
  /**
   * Severity of `ardo lint` rules. `error` makes `ardo lint` exit non-zero; `warn` only reports.
   * Lint never affects `ardo build`. Every rule defaults to `warn`.
   */
  lint?: Partial<Record<LintRuleId, DiagnosticLevel>>
}

// =============================================================================
// Page Types
// =============================================================================

/** Color of a page banner. Uses the same palette as the callout with the same name. */
export type PageBannerVariant = "danger" | "info" | "note" | "tip" | "warning"

/** Notice above the page content, from the `banner` frontmatter field. */
export type PageBannerConfig = {
  /** Plain text shown in the banner. Markdown syntax is not rendered. */
  content: string
  /** Defaults to `"info"`. */
  variant?: PageBannerVariant
  /** Stable key for dismissal. Required when `dismissible` is true. */
  id?: string
  /** Shows a close button that hides the banner for this browser. */
  dismissible?: boolean
}

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
  /** `bare` drops the sidebar and the page rail, as on a landing page. */
  layout?: "bare" | "default"
  /** Use a viewport-wide shell (default), or false for a centered page-width shell. */
  fullWidth?: boolean
  /** Use a reading column (default) or a wider page container for article content. */
  contentWidth?: "reading" | "page"
  sidebar?: "leaf" | boolean
  outline?: [number, number] | boolean | number
  editLink?: boolean
  lastUpdated?: boolean
  /** Set to false to hide the Copy page and View as Markdown actions on this page. */
  pageActions?: boolean
  sitemap?: boolean
  /** Set to false to use description only as metadata, not as visible page lede. */
  lede?: boolean
  /**
   * Set to false to leave the page out of `llms.txt` and `llms-full.txt`. It also gets no
   * Markdown file of its own, so its Copy page and View as Markdown actions are hidden.
   */
  llms?: boolean
  /** Notice above the page content. A string sets the text; an object sets the variant and dismissal. */
  banner?: PageBannerConfig
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
  /** `false` turns off every `ardo lint` rule for this page; `disable` turns off named rules. */
  lint?: boolean | { disable?: LintRuleId[] }
} & Partial<PostFrontmatter> &
  Record<string, unknown>

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
  /** URL of the page's Markdown file, when the build writes one; the page actions link to it. */
  markdownPath?: string
  /** Prepared responsive images of an opted-in Markdown page. */
  images?: Record<string, PostImage>
}

// =============================================================================
// Resolved Config (Internal)
// =============================================================================

export type ResolvedConfig = {
  /**
   * The configured deployment base before version and locale prefixes are applied.
   *
   * `base` is the canonical public route base used by the app runtime. Root-emitted
   * files such as `robots.txt`, `sitemap.xml`, and `llms.txt` need this unversioned
   * base because they are written beside the version folders.
   */
  deploymentBase: string
  images?: ImagesConfig
  project: ProjectMeta
  vite?: Record<string, unknown>
  root: string
  contentDir: string
  /** Optional for compatibility with manually constructed test/config fixtures. */
  validation?: ContentValidationConfig
  /** Optional for the same reason as `validation`. */
  navigation?: NavigationConfig
  openapi?: OpenApiConfig
  /**
   * Absolute URL of `/.well-known/ard.json`. Set only when discovery files are published, so a
   * page links it exactly when the file exists.
   */
  agentDiscoveryUrl?: string
  /**
   * The pinned build moment in canonical UTC ISO form. Present exactly when the site configured
   * `buildTime`; each clock site falls back to the current time when it is absent.
   */
  buildTime?: string
  /**
   * The configured commit reference, `""` included. Present exactly when the site configured
   * `buildHash`; the client config falls back to the detected Git hash when it is absent.
   */
  buildHash?: string
  /** The configured `trailingSlash`; absent when the site keeps Ardo's earlier mixed spelling. */
  trailingSlash?: boolean
  /** The configured `sourceRoot` as an absolute path; absent when the site did not set it. */
  sourceRoot?: string
} & Required<
  Omit<
    ArdoConfig,
    | "buildHash"
    | "buildTime"
    | "sourceRoot"
    | "trailingSlash"
    | "navigation"
    | "openapi"
    | "project"
    | "publication"
    | "images"
    | "validation"
    | "vite"
  >
>
