import { createContext, useContext, type ReactNode } from "react"
import type { ArdoConfig, SidebarItem, TOCItem, PageData } from "../config/types"

interface ArdoContextValue {
  config: ArdoConfig
  sidebar: SidebarItem[]
  currentPage?: PageData
}

const ArdoContext = createContext<ArdoContextValue | null>(null)

export function useArdoContext(): ArdoContextValue {
  const context = useContext(ArdoContext)
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
  return (
    <ArdoContext.Provider value={{ config, sidebar, currentPage }}>{children}</ArdoContext.Provider>
  )
}

export { ArdoContext }

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
  return useContext(ArdoSiteConfigContext)
}

interface ArdoSiteConfigProviderProps {
  value: ArdoSiteConfig
  children: ReactNode
}

export function ArdoSiteConfigProvider({ value, children }: ArdoSiteConfigProviderProps) {
  return <ArdoSiteConfigContext.Provider value={value}>{children}</ArdoSiteConfigContext.Provider>
}
