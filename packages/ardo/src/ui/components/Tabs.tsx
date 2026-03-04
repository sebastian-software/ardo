import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react"
import * as styles from "./Tabs.css"

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
  getTabValue: (value?: string) => string
  getPanelValue: (value?: string) => string
}

const TabsContext = createContext<TabsContextValue | null>(null)
const AUTO_TAB_PREFIX = "__ardo-tab-"

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("Tab components must be used within an ArdoTabs component")
  }
  return context
}

export interface ArdoTabsProps {
  /** Default active tab value */
  defaultValue?: string
  /** Tab components (ArdoTabList and ArdoTabPanels) */
  children: ReactNode
}

/**
 * Tabs container component for organizing content into tabbed panels.
 */
export function ArdoTabs({ defaultValue, children }: ArdoTabsProps) {
  const [activeTab, setActiveTab] = useState(() => defaultValue ?? findFirstTabValue(children))
  const tabIndexRef = useRef(0)
  const panelIndexRef = useRef(0)

  tabIndexRef.current = 0
  panelIndexRef.current = 0

  const getTabValue = (value?: string) => {
    const index = tabIndexRef.current++
    return value ?? `${AUTO_TAB_PREFIX}${index}`
  }

  const getPanelValue = (value?: string) => {
    const index = panelIndexRef.current++
    return value ?? `${AUTO_TAB_PREFIX}${index}`
  }

  useEffect(() => {
    if (defaultValue !== undefined) {
      setActiveTab(defaultValue)
    }
  }, [defaultValue])

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, getTabValue, getPanelValue }}>
      <div className={styles.tabs}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface ArdoTabListProps {
  /** Tab buttons */
  children: ReactNode
}

/**
 * Container for ArdoTab buttons.
 */
export function ArdoTabList({ children }: ArdoTabListProps) {
  return (
    <div className={styles.tabList} role="tablist">
      {children}
    </div>
  )
}

export interface ArdoTabProps {
  /** Unique value identifying this tab (optional if tab order matches panels) */
  value?: string
  /** Tab button label */
  children: ReactNode
}

/**
 * Individual tab button.
 */
export function ArdoTab({ value, children }: ArdoTabProps) {
  const { activeTab, setActiveTab, getTabValue } = useTabsContext()
  const resolvedValue = getTabValue(value)
  const isActive = activeTab === resolvedValue

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={[styles.tab, isActive && "active"].filter(Boolean).join(" ")}
      onClick={() => setActiveTab(resolvedValue)}
    >
      {children}
    </button>
  )
}

export interface ArdoTabPanelProps {
  /** Value matching the corresponding ArdoTab (optional if panel order matches tabs) */
  value?: string
  /** Panel content */
  children: ReactNode
}

/**
 * Content panel for a tab.
 */
export function ArdoTabPanel({ value, children }: ArdoTabPanelProps) {
  const { activeTab, getPanelValue } = useTabsContext()
  const resolvedValue = getPanelValue(value)
  const isActive = activeTab === resolvedValue

  if (!isActive) {
    return null
  }

  return (
    <div role="tabpanel" className={styles.tabPanel}>
      {children}
    </div>
  )
}

export interface ArdoTabPanelsProps {
  /** ArdoTabPanel components */
  children: ReactNode
}

/**
 * Container for ArdoTabPanel components.
 */
export function ArdoTabPanels({ children }: ArdoTabPanelsProps) {
  return <div className={styles.tabPanels}>{children}</div>
}

function findFirstTabValue(children: ReactNode): string {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) {
      continue
    }

    if (child.type === ArdoTab) {
      const tabValue = (child.props as { value?: string }).value
      return tabValue ?? `${AUTO_TAB_PREFIX}0`
    }

    const nestedChildren = (child.props as { children?: ReactNode }).children
    if (nestedChildren) {
      const nestedValue = findFirstTabValue(nestedChildren)
      if (nestedValue) {
        return nestedValue
      }
    }
  }

  return ""
}
