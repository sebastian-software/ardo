import {
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  use,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

import { handleTabListKeyDown, useHiddenUntilFound } from "./disclosure"
import * as styles from "./Tabs.css"

type TabsContextValue = {
  activeTab: string
  setActiveTab: (tab: string) => void
  getPanelId: (value: string) => string
  getTabId: (value: string) => string
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
  /** Default active tab value; set explicitly when custom components create the tabs. */
  defaultValue?: string
  /** Tab components (ArdoTabList and ArdoTabPanels) */
  children: ReactNode
}

/**
 * Tabs container component for organizing content into tabbed panels.
 */
export function ArdoTabs({ defaultValue, children }: ArdoTabsProps) {
  const tabsId = useId()
  const [selectedTab, setSelectedTab] = useState(defaultValue)
  const indexes: TabChildIndexes = {
    panels: 0,
    tabs: 0,
    tabValues: [],
    hasCustomComponents: false,
  }
  const indexedChildren = assignImplicitValues(children, indexes)
  const activeTab = resolveActiveTab(selectedTab, indexes)

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
      activeTab,
      setActiveTab: setSelectedTab,
      getPanelId,
      getTabId,
    }),
    [activeTab, getPanelId, getTabId]
  )

  return (
    <TabsContext value={contextValue}>
      <div className={styles.tabs}>{indexedChildren}</div>
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
  /**
   * Unique value identifying this tab (optional if tab order matches panels).
   * Custom components that create tabs internally need explicit matching values.
   */
  value?: string
  /** Tab button label */
  children: ReactNode
}

/**
 * Individual tab button.
 */
export function ArdoTab({ value, children }: ArdoTabProps) {
  const { activeTab, setActiveTab, getPanelId, getTabId } = useTabsContext()
  const resolvedValue = value ?? `${AUTO_TAB_PREFIX}0`
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
  /**
   * Value matching the corresponding ArdoTab (optional if panel order matches tabs).
   * Custom components that create panels internally need explicit matching values.
   */
  value?: string
  /** Panel content */
  children: ReactNode
}

/**
 * Content panel for a tab.
 */
export function ArdoTabPanel({ value, children }: ArdoTabPanelProps) {
  const { activeTab, setActiveTab, getPanelId, getTabId } = useTabsContext()
  const resolvedValue = value ?? `${AUTO_TAB_PREFIX}0`
  const isActive = activeTab === resolvedValue
  const panelRef = useRef<HTMLDivElement>(null)
  // Inactive panels stay in the prerendered HTML for crawlers, print, and find-in-page.
  useHiddenUntilFound(panelRef, !isActive, () => {
    setActiveTab(resolvedValue)
  })

  return (
    <div
      ref={panelRef}
      role="tabpanel"
      id={getPanelId(resolvedValue)}
      aria-labelledby={getTabId(resolvedValue)}
      tabIndex={0}
      className={styles.tabPanel}
      hidden={!isActive}
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

type TabChildIndexes = {
  panels: number
  tabs: number
  /** Values of the tabs found in the children, in order. */
  tabValues: string[]
  /** Custom components may render tabs of their own, which the scan cannot see. */
  hasCustomComponents: boolean
}

/** Elements whose rendered output is just their children. */
const TRANSPARENT_TYPES = new Set<unknown>([Fragment, ArdoTabList, ArdoTabPanels])

/**
 * The selected tab, or the first tab when the selection matches none, so the
 * tablist always has a focusable tab. A selection that may belong to a tab
 * inside a custom component stays as is.
 */
function resolveActiveTab(selectedTab: string | undefined, indexes: TabChildIndexes): string {
  const { tabValues, hasCustomComponents } = indexes
  if (selectedTab != null && (hasCustomComponents || tabValues.includes(selectedTab))) {
    return selectedTab
  }
  return tabValues[0] ?? selectedTab ?? ""
}

function assignImplicitValues(children: ReactNode, indexes: TabChildIndexes): ReactNode {
  if (isReactNodeArray(children)) {
    return assignChildSequence(children, indexes)
  }

  if (!isValidElement<{ children?: ReactNode; value?: string }>(children)) {
    return isIterableNode(children) ? assignChildSequence(children, indexes) : children
  }

  return assignElementValue(children, indexes)
}

function assignChildSequence(children: Iterable<ReactNode>, indexes: TabChildIndexes): ReactNode[] {
  const values: ReactNode[] = []
  for (const child of children) {
    const value = assignImplicitValues(child, indexes)
    // The clones render as one array, so each needs an explicit key. Children
    // .toArray is not enough: React 19 still warns about the keys it invents.
    values.push(
      isValidElement(value) && value.key == null ? (
        <Fragment key={`ardo-tabs-${values.length}`}>{value}</Fragment>
      ) : (
        value
      )
    )
  }
  return values
}

function assignElementValue(
  child: ReactElement<{ children?: ReactNode; value?: string }>,
  indexes: TabChildIndexes
): ReactNode {
  if (child.type === ArdoTabs) return child

  if (child.type === ArdoTab) {
    const value = child.props.value ?? `${AUTO_TAB_PREFIX}${indexes.tabs}`
    indexes.tabs += 1
    indexes.tabValues.push(value)
    return cloneElement(child, { value })
  }

  if (child.type === ArdoTabPanel) {
    const value = child.props.value ?? `${AUTO_TAB_PREFIX}${indexes.panels}`
    indexes.panels += 1
    return cloneElement(child, { value })
  }

  if (typeof child.type !== "string" && !TRANSPARENT_TYPES.has(child.type)) {
    indexes.hasCustomComponents = true
  }
  if (child.props.children == null) return child
  const nestedChildren = assignImplicitValues(child.props.children, indexes)
  return cloneElement(child, undefined, nestedChildren)
}

function isReactNodeArray(value: ReactNode): value is readonly ReactNode[] {
  return Array.isArray(value)
}

function isIterableNode(value: ReactNode): value is Iterable<ReactNode> {
  return (
    typeof value === "object" &&
    value !== null &&
    !isValidElement(value) &&
    Symbol.iterator in value
  )
}

function toDomIdSegment(value: string) {
  return Array.from(value, (char) => char.charCodeAt(0).toString(36)).join("-")
}
