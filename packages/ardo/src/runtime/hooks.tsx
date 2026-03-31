import { createContext, type ReactNode, use, useMemo } from "react"

import type { ArdoConfig, PageData, SidebarItem, TOCItem } from "../config/types"

interface ArdoContextValue {
  config: ArdoConfig
  sidebar: SidebarItem[]
  currentPage?: PageData
}

const ArdoContext = createContext<ArdoContextValue | null>(null)

export function useArdoContext(): ArdoContextValue {
  const context = use(ArdoContext)
  if (!context) {
    throw new Error("useArdoContext must be used within an ArdoProvider")
  }
  return context
}

export function useArdoConfig(): ArdoConfig {
  const { config } = useArdoContext()
  return config
}

export function useArdoSidebar(): SidebarItem[] {
  const { sidebar } = useArdoContext()
  return sidebar
}

export function useArdoPageData(): PageData | undefined {
  const { currentPage } = useArdoContext()
  return currentPage
}

export function useArdoTOC(): TOCItem[] {
  const { currentPage } = useArdoContext()
  return currentPage?.toc ?? []
}

interface ArdoProviderProps {
  config: ArdoConfig
  sidebar: SidebarItem[]
  currentPage?: PageData
  children: ReactNode
}

export function ArdoProvider({ config, sidebar, currentPage, children }: ArdoProviderProps) {
  const contextValue = useMemo(
    () => ({ config, sidebar, currentPage }),
    [config, currentPage, sidebar]
  )
  return <ArdoContext value={contextValue}>{children}</ArdoContext>
}

export { ArdoContext }

// =============================================================================
// ArdoPageDataProvider — injects page-level data (frontmatter, toc) into context
// Used by the Vite transform to wrap MDX default exports.
// =============================================================================

interface ArdoPageDataProviderProps {
  frontmatter: PageData["frontmatter"]
  toc: TOCItem[]
  children: ReactNode
}

export function ArdoPageDataProvider({ frontmatter, toc, children }: ArdoPageDataProviderProps) {
  const parent = use(ArdoContext)
  const pageData: PageData = useMemo(
    () => ({
      title: (frontmatter?.title as string) ?? "",
      frontmatter: frontmatter ?? {},
      toc: toc ?? [],
      content: "",
      filePath: "",
      relativePath: "",
    }),
    [frontmatter, toc]
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

export interface ArdoSiteConfig {
  editLink?: { pattern: string; text?: string }
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  tocLabel?: string
}

const ArdoSiteConfigContext = createContext<ArdoSiteConfig>({})

export function useArdoSiteConfig(): ArdoSiteConfig {
  return use(ArdoSiteConfigContext)
}

interface ArdoSiteConfigProviderProps {
  value: ArdoSiteConfig
  children: ReactNode
}

export function ArdoSiteConfigProvider({ value, children }: ArdoSiteConfigProviderProps) {
  return <ArdoSiteConfigContext value={value}>{children}</ArdoSiteConfigContext>
}
