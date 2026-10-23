import { createContext, type ReactNode, use, useMemo } from "react"

import type { ArdoConfig, PageData, SidebarItem, TOCItem } from "../config/types"
import type { ArdoLabels } from "../ui/labels"

import { defaultArdoLabels } from "../ui/labels"
import { useArdoPage } from "./page-context"

type ArdoContextValue = {
  config: ArdoConfig
  sidebar: SidebarItem[]
  currentPage?: PageData
}

const ArdoContext = createContext<ArdoContextValue | null>(null)

/** The site config, the sidebar, and the current page together. Throws outside `ArdoProvider`. */
export function useArdoContext(): ArdoContextValue {
  const context = use(ArdoContext)
  if (!context) {
    throw new Error("useArdoContext must be used within an ArdoProvider")
  }
  return context
}

/**
 * The site config from `ardo.config.ts`. Ardo's entries provide it to the whole
 * page tree, and `ArdoRoot` provides it again together with the sidebar.
 */
export function useArdoConfig(): ArdoConfig {
  const context = use(ArdoContext)
  const siteConfig = use(ArdoConfigContext)
  const config = context?.config ?? siteConfig
  if (config == null) {
    throw new Error("useArdoConfig must be used within Ardo's app or an ArdoProvider")
  }
  return config
}

/** The sidebar items of the current section. */
export function useArdoSidebar(): SidebarItem[] {
  const { sidebar } = useArdoContext()
  return sidebar
}

/**
 * Title, frontmatter, outline, and source path of the current Markdown or MDX page. `undefined`
 * outside page content.
 */
export function useArdoPageData(): PageData | undefined {
  const { currentPage } = useArdoContext()
  return currentPage
}

/** The outline of the current page, or an empty list. */
export function useArdoTOC(): TOCItem[] {
  const { currentPage } = useArdoContext()
  return currentPage?.toc ?? []
}

type ArdoProviderProps = {
  config: ArdoConfig
  sidebar: SidebarItem[]
  currentPage?: PageData
  children: ReactNode
}

/**
 * Provides the site config, the sidebar, and the current page to Ardo's hooks. `ArdoRoot`
 * renders it; render it yourself only in tests and isolated previews.
 */
export function ArdoProvider({ config, sidebar, currentPage, children }: ArdoProviderProps) {
  const contextValue = useMemo(
    () => ({ config, sidebar, currentPage }),
    [config, currentPage, sidebar]
  )
  return <ArdoContext value={contextValue}>{children}</ArdoContext>
}

export { ArdoContext }

// =============================================================================
// ArdoConfig — the site config, provided by Ardo's entries
// =============================================================================

const ArdoConfigContext = createContext<ArdoConfig | null>(null)

type ArdoConfigProviderProps = {
  config: ArdoConfig
  children: ReactNode
}

/**
 * Provides the site config to the page tree. Ardo's client and server entries
 * render it around the root component; tests and previews can do the same.
 */
export function ArdoConfigProvider({ config, children }: ArdoConfigProviderProps) {
  return <ArdoConfigContext value={config}>{children}</ArdoConfigContext>
}

export { ArdoConfigContext }

// =============================================================================
// ArdoPageDataProvider — injects page-level data (frontmatter, toc) into context
// Used by the Vite transform to wrap MDX default exports.
// =============================================================================

type ArdoPageDataProviderProps = {
  frontmatter: PageData["frontmatter"]
  toc: TOCItem[]
  children: ReactNode
}

/**
 * Provides a Markdown page's frontmatter and outline to `useArdoPageData` and `useArdoTOC`. Ardo
 * wraps every compiled Markdown and MDX page in it.
 */
export function ArdoPageDataProvider({ frontmatter, toc, children }: ArdoPageDataProviderProps) {
  const parent = use(ArdoContext)
  const { source } = useArdoPage()
  const pageData: PageData = useMemo(
    () => ({
      title: typeof frontmatter.title === "string" ? frontmatter.title : "",
      frontmatter,
      toc,
      content: "",
      filePath: source?.relativePath ?? "",
      relativePath: source?.relativePath ?? "",
      lastUpdated: source?.lastUpdated,
    }),
    [frontmatter, toc, source]
  )
  const value = useMemo(
    () => (parent ? { ...parent, currentPage: pageData } : null),
    [parent, pageData]
  )

  if (!value) return <>{children}</>
  return <ArdoContext value={value}>{children}</ArdoContext>
}

// =============================================================================
// ArdoSiteConfig — cross-cutting content settings (editLink, lastUpdated, TOC)
// =============================================================================

export type ArdoSiteConfig = {
  editLink?: { pattern: string; text?: string }
  labels?: ArdoLabels
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  tocLabel?: string
}

const ArdoSiteConfigContext = createContext<ArdoSiteConfig>({})

/** The `editLink`, `lastUpdated`, `labels`, and `tocLabel` settings passed to `ArdoRoot`. */
export function useArdoSiteConfig(): ArdoSiteConfig {
  return use(ArdoSiteConfigContext)
}

/** The labels and aria text of Ardo's UI, with the overrides passed to `ArdoRoot`. */
export function useArdoLabels(): ArdoLabels {
  return useArdoSiteConfig().labels ?? defaultArdoLabels
}

type ArdoSiteConfigProviderProps = {
  value: ArdoSiteConfig
  children: ReactNode
}

/**
 * Provides the `editLink`, `lastUpdated`, `labels`, and `tocLabel` settings. `ArdoRoot` renders
 * it from its props.
 */
export function ArdoSiteConfigProvider({ value, children }: ArdoSiteConfigProviderProps) {
  return <ArdoSiteConfigContext value={value}>{children}</ArdoSiteConfigContext>
}
