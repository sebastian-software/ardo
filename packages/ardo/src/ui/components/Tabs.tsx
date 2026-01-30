import { useState, createContext, useContext, type ReactNode } from "react"

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("Tab components must be used within a Tabs component")
  }
  return context
}

export interface TabsProps {
  /** Default active tab value */
  defaultValue?: string
  /** Tab components (TabList and TabPanels) */
  children: ReactNode
}

/**
 * Tabs container component for organizing content into tabbed panels.
 */
export function Tabs({ defaultValue, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || "")

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="ardo-tabs">{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabListProps {
  /** Tab buttons */
  children: ReactNode
}

/**
 * Container for Tab buttons.
 */
export function TabList({ children }: TabListProps) {
  return (
    <div className="ardo-tab-list" role="tablist">
      {children}
    </div>
  )
}

export interface TabProps {
  /** Unique value identifying this tab */
  value: string
  /** Tab button label */
  children: ReactNode
}

/**
 * Individual tab button.
 */
export function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={["ardo-tab", isActive && "active"].filter(Boolean).join(" ")}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

export interface TabPanelProps {
  /** Value matching the corresponding Tab */
  value: string
  /** Panel content */
  children: ReactNode
}

/**
 * Content panel for a tab.
 */
export function TabPanel({ value, children }: TabPanelProps) {
  const { activeTab } = useTabsContext()
  const isActive = activeTab === value

  if (!isActive) {
    return null
  }

  return (
    <div role="tabpanel" className="ardo-tab-panel">
      {children}
    </div>
  )
}

export interface TabPanelsProps {
  /** TabPanel components */
  children: ReactNode
}

/**
 * Container for TabPanel components.
 */
export function TabPanels({ children }: TabPanelsProps) {
  return <div className="ardo-tab-panels">{children}</div>
}
