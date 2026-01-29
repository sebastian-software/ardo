import { createContext, useContext, type ReactNode } from "react"
import type { PressConfig, ThemeConfig, SidebarItem, TOCItem, PageData } from "../config/types"

interface PressContextValue {
  config: PressConfig
  sidebar: SidebarItem[]
  currentPage?: PageData
}

const PressContext = createContext<PressContextValue | null>(null)

export function usePressContext(): PressContextValue {
  const context = useContext(PressContext)
  if (!context) {
    throw new Error("usePressContext must be used within a PressProvider")
  }
  return context
}

export function useConfig(): PressConfig {
  const { config } = usePressContext()
  return config
}

export function useThemeConfig(): ThemeConfig {
  const { config } = usePressContext()
  return config.themeConfig ?? {}
}

export function useSidebar(): SidebarItem[] {
  const { sidebar } = usePressContext()
  return sidebar
}

export function usePageData(): PageData | undefined {
  const { currentPage } = usePressContext()
  return currentPage
}

export function useTOC(): TOCItem[] {
  const { currentPage } = usePressContext()
  return currentPage?.toc ?? []
}

interface PressProviderProps {
  config: PressConfig
  sidebar: SidebarItem[]
  currentPage?: PageData
  children: ReactNode
}

export function PressProvider({ config, sidebar, currentPage, children }: PressProviderProps) {
  return (
    <PressContext.Provider value={{ config, sidebar, currentPage }}>
      {children}
    </PressContext.Provider>
  )
}

export { PressContext }
