import {
  Children,
  createContext,
  isValidElement,
  type KeyboardEvent,
  type ReactNode,
  use,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

import * as styles from "./Tabs.css"

type TabsContextValue = {
  activeTab: string
  setActiveTab: (tab: string) => void
  getPanelId: (value: string) => string
  getTabValue: (value?: string) => string
  getTabId: (value: string) => string
  getPanelValue: (value?: string) => string
}

const TabsContext = createContext<null | TabsContextValue>(null)
const AUTO_TAB_PREFIX = "__ardo-tab-"

function useTabsContext() {
  const context = use(TabsContext)
  if (!context) {
    throw new Error("Tab components must be used within an ArdoTabs component")
  }
  return context
}

export type ArdoTabsProps = {
  /** Default active tab value */
  defaultValue?: string
  /** Tab components (ArdoTabList and ArdoTabPanels) */
  children: ReactNode
}

/**
 * Tabs container component for organizing content into tabbed panels.
 */
export function ArdoTabs({ defaultValue, children }: ArdoTabsProps) {
  const tabsId = useId()
  const [activeTab, setActiveTab] = useState(() => defaultValue ?? findFirstTabValue(children))
  const tabIndexRef = useRef(0)
  const panelIndexRef = useRef(0)

  tabIndexRef.current = 0
  panelIndexRef.current = 0

  const getTabValue = useCallback((value?: string) => {
    const index = tabIndexRef.current++
    return value ?? `${AUTO_TAB_PREFIX}${index}`
  }, [])

  const getPanelValue = useCallback((value?: string) => {
    const index = panelIndexRef.current++
    return value ?? `${AUTO_TAB_PREFIX}${index}`
  }, [])

  const effectiveTab = defaultValue ?? activeTab
  const getTabId = useCallback(
    (value: string) => `${tabsId}-tab-${toDomIdSegment(value)}`,
    [tabsId]
  )
  const getPanelId = useCallback(
    (value: string) => `${tabsId}-panel-${toDomIdSegment(value)}`,
    [tabsId]
  )

  const contextValue = useMemo(
    () => ({
      activeTab: effectiveTab,
      setActiveTab,
      getPanelId,
      getPanelValue,
      getTabId,
      getTabValue,
    }),
    [effectiveTab, getPanelId, getPanelValue, getTabId, getTabValue]
  )

  return (
    <TabsContext value={contextValue}>
      <div className={styles.tabs}>{children}</div>
    </TabsContext>
  )
}

export type ArdoTabListProps = {
  /** Tab buttons */
  children: ReactNode
}

/**
 * Container for ArdoTab buttons.
 */
export function ArdoTabList({ children }: ArdoTabListProps) {
  return (
    <div className={styles.tabList} role="tablist" onKeyDown={handleTabListKeyDown}>
      {children}
    </div>
  )
}

export type ArdoTabProps = {
  /** Unique value identifying this tab (optional if tab order matches panels) */
  value?: string
  /** Tab button label */
  children: ReactNode
}

/**
 * Individual tab button.
 */
export function ArdoTab({ value, children }: ArdoTabProps) {
  const { activeTab, setActiveTab, getPanelId, getTabId, getTabValue } = useTabsContext()
  const resolvedValue = getTabValue(value)
  const isActive = activeTab === resolvedValue

  return (
    <button
      type="button"
      role="tab"
      id={getTabId(resolvedValue)}
      aria-controls={getPanelId(resolvedValue)}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      data-ardo-tab-value={resolvedValue}
      className={[styles.tab, isActive && "active"].filter(Boolean).join(" ")}
      onClick={() => {
        setActiveTab(resolvedValue)
      }}
    >
      {children}
    </button>
  )
}

export type ArdoTabPanelProps = {
  /** Value matching the corresponding ArdoTab (optional if panel order matches tabs) */
  value?: string
  /** Panel content */
  children: ReactNode
}

/**
 * Content panel for a tab.
 */
export function ArdoTabPanel({ value, children }: ArdoTabPanelProps) {
  const { activeTab, getPanelId, getPanelValue, getTabId } = useTabsContext()
  const resolvedValue = getPanelValue(value)
  const isActive = activeTab === resolvedValue

  if (!isActive) {
    return null
  }

  return (
    <div
      role="tabpanel"
      id={getPanelId(resolvedValue)}
      aria-labelledby={getTabId(resolvedValue)}
      tabIndex={0}
      className={styles.tabPanel}
    >
      {children}
    </div>
  )
}

export type ArdoTabPanelsProps = {
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
    const tabValue = getFirstTabValueFromChild(child)
    if (tabValue != null) {
      return tabValue
    }
  }

  return ""
}

function getFirstTabValueFromChild(child: ReactNode): null | string {
  if (!isValidElement<{ children?: ReactNode }>(child)) {
    return null
  }

  if (isValidElement<ArdoTabProps>(child) && child.type === ArdoTab) {
    return child.props.value ?? `${AUTO_TAB_PREFIX}0`
  }

  const nestedChildren = child.props.children
  if (nestedChildren == null) {
    return null
  }

  const nestedValue = findFirstTabValue(nestedChildren)
  return nestedValue === "" ? null : nestedValue
}

function handleTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  if (!isTabNavigationKey(event.key)) {
    return
  }

  const tabs = getTabsFromList(event.currentTarget)
  if (tabs.length === 0) {
    return
  }

  if (!(event.target instanceof HTMLButtonElement)) {
    return
  }

  const currentIndex = tabs.indexOf(event.target)
  if (currentIndex === -1) {
    return
  }

  event.preventDefault()
  const nextTab = tabs[getNextTabIndex(event.key, currentIndex, tabs.length)]
  nextTab.focus()
  nextTab.click()
}

function isTabNavigationKey(key: string) {
  return key === "ArrowLeft" || key === "ArrowRight" || key === "Home" || key === "End"
}

function getTabsFromList(tabList: HTMLDivElement) {
  return [...tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
}

function getNextTabIndex(key: string, currentIndex: number, tabCount: number) {
  switch (key) {
    case "ArrowLeft":
      return (currentIndex - 1 + tabCount) % tabCount
    case "ArrowRight":
      return (currentIndex + 1) % tabCount
    case "Home":
      return 0
    case "End":
      return tabCount - 1
    default:
      return currentIndex
  }
}

function toDomIdSegment(value: string) {
  return Array.from(value, (char) => char.charCodeAt(0).toString(36)).join("-")
}
