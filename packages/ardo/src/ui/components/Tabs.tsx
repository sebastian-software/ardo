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

interface TabsProps {
  defaultValue?: string
  children: ReactNode
}

export function Tabs({ defaultValue, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || "")

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="ardo-tabs">{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: ReactNode
}

export function TabList({ children }: TabListProps) {
  return (
    <div className="ardo-tab-list" role="tablist">
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  children: ReactNode
}

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

interface TabPanelProps {
  value: string
  children: ReactNode
}

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

interface TabPanelsProps {
  children: ReactNode
}

export function TabPanels({ children }: TabPanelsProps) {
  return <div className="ardo-tab-panels">{children}</div>
}
