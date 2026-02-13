import { createContext, useContext, type ReactNode } from "react"
import type { ArdoConfig, ThemeConfig, SidebarItem, TOCItem, PageData } from "../config/types"

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

export function useConfig(): ArdoConfig {
  const { config } = useArdoContext()
  return config
}

export function useThemeConfig(): ThemeConfig {
  const { config } = useArdoContext()
  return config.themeConfig ?? {}
}

export function useSidebar(): SidebarItem[] {
  const { sidebar } = useArdoContext()
  return sidebar
}

export function usePageData(): PageData | undefined {
  const { currentPage } = useArdoContext()
  return currentPage
}

export function useTOC(): TOCItem[] {
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
