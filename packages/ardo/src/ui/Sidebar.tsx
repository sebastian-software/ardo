/* eslint-disable max-lines */
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  use,
  useId,
  useMemo,
  useState,
} from "react"
import { NavLink, useLocation } from "react-router"

import type { SidebarItem as SidebarItemType } from "../config/types"

import { useArdoContexts, useArdoLabels, useArdoSidebar } from "../runtime/hooks"
import { joinClassNames } from "./classnames"
import { ChevronDownIcon, FileTextIcon, FolderIcon } from "./icons"
import * as styles from "./Sidebar.css"
import { getContextRailItems, SidebarRail } from "./SidebarRail"

/** Route path type - uses React Router's NavLink 'to' prop type for type-safe routes */
type RoutePath = ComponentProps<typeof NavLink>["to"]

// =============================================================================
// Sidebar Context
// =============================================================================

type SidebarContextValue = {
  currentPath: string
}

const SidebarContext = createContext<SidebarContextValue>({ currentPath: "" })

function useSidebarContext() {
  return use(SidebarContext)
}

// =============================================================================
// Sidebar Component Types
// =============================================================================

export type ArdoSidebarProps = {
  /** Sidebar items (for data-driven approach) */
  items?: SidebarItemType[]
  /** Children for JSX composition (SidebarGroup, SidebarLink) */
  children?: ReactNode
  /** Content rendered above navigation (e.g. search) */
  header?: ReactNode
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// Sidebar Main Component
// =============================================================================

/**
 * Sidebar component supporting data-driven, JSX composition, and zero-config patterns.
 *
 * When neither `items` nor `children` are provided, automatically renders from
 * the Ardo sidebar context (`virtual:ardo/sidebar`).
 *
 * @example Zero-config (from context)
 * ```tsx
 * <Sidebar />
 * ```
 *
 * @example Data-driven (items prop)
 * ```tsx
 * <Sidebar items={[
 *   { text: 'Introduction', link: '/intro' },
 *   { text: 'Guide', items: [
 *     { text: 'Getting Started', link: '/guide/getting-started' }
 *   ]}
 * ]} />
 * ```
 *
 * @example JSX composition
 * ```tsx
 * <Sidebar>
 *   <SidebarLink to="/intro">Introduction</SidebarLink>
 *   <SidebarGroup title="Guide">
 *     <SidebarLink to="/guide/getting-started">Getting Started</SidebarLink>
 *   </SidebarGroup>
 * </Sidebar>
 * ```
 */
export function ArdoSidebar({ items, children, header, className }: ArdoSidebarProps) {
  const { pathname } = useLocation()
  const labels = useArdoLabels()
  const contextSidebar = useArdoSidebar()
  const { items: contexts, activeId } = useArdoContexts()
  const hasCustomChildren = children != null
  const resolvedItems = items ?? (hasCustomChildren ? undefined : contextSidebar)
  const hasResolvedItems = (resolvedItems?.length ?? 0) > 0
  // The rail is exclusively a high-level context switcher, and a switcher only
  // makes sense with more than one destination. With zero or one context it
  // carries no icons (`SidebarRail` still renders its empty surface); sidebar
  // sections are never mirrored, so no duplicate links appear.
  const railItems = contexts.length > 1 ? getContextRailItems(contexts, activeId) : []
  const contextValue = useMemo(() => ({ currentPath: pathname }), [pathname])

  return (
    <SidebarContext value={contextValue}>
      <aside className={joinClassNames("ardo-sidebar", className ?? styles.sidebar)}>
        <SidebarRail items={railItems} />
        <div className={styles.sidebarPanel}>
          {header != null && <div className={styles.sidebarHeader}>{header}</div>}
          <nav aria-label={labels.sidebar.mainNavigation} className={styles.sidebarNav}>
            {hasCustomChildren ? (
              <ul className={`${styles.sidebarList} ${styles.sidebarList0}`}>{children}</ul>
            ) : hasResolvedItems ? (
              <SidebarItems items={resolvedItems ?? []} depth={0} />
            ) : null}
          </nav>
        </div>
      </aside>
    </SidebarContext>
  )
}

// =============================================================================
// SidebarGroup Component
// =============================================================================

export type ArdoSidebarGroupProps = {
  /** Group title */
  title: string
  /** Optional link for the group title */
  to?: string
  /** Initial collapsed state (default: false) */
  collapsed?: boolean
  /** Whether group is collapsible (default: true if has children) */
  collapsible?: boolean
  /** Children (SidebarLink, nested SidebarGroup) */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Group component for organizing sidebar links.
 *
 * @example
 * ```tsx
 * <SidebarGroup title="Guide">
 *   <SidebarLink to="/guide/intro">Introduction</SidebarLink>
 *   <SidebarLink to="/guide/setup">Setup</SidebarLink>
 * </SidebarGroup>
 * ```
 *
 * @example With collapsible state
 * ```tsx
 * <SidebarGroup title="Advanced" collapsed>
 *   <SidebarLink to="/advanced/config">Configuration</SidebarLink>
 * </SidebarGroup>
 * ```
 */
export function ArdoSidebarGroup({
  title,
  to,
  collapsed: initialCollapsed = false,
  collapsible = true,
  children,
  className,
}: ArdoSidebarGroupProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const labels = useArdoLabels()
  const { currentPath } = useSidebarContext()
  const contentId = useId()

  // Check if any child is active
  const hasActiveChild = checkChildrenActive(children, currentPath)

  const textClassName = [styles.sidebarText, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")
  const textButtonClassName = [textClassName, styles.sidebarTextButton].join(" ")

  const hasChildren = Children.count(children) > 0
  const hasTo = (to ?? "") !== ""
  const canToggle = collapsible && hasChildren
  const toggleLabel = `${collapsed ? "Expand" : "Collapse"} ${title}`

  const itemClassName =
    className ??
    [styles.sidebarItem, hasChildren && styles.sidebarItemGroup].filter(Boolean).join(" ")

  return (
    <li className={itemClassName}>
      <div className={styles.sidebarItemHeader}>
        {hasTo ? (
          <NavLink
            to={to ?? "/"}
            end
            className={({ isActive }) =>
              [textClassName, isActive && "active"].filter(Boolean).join(" ")
            }
          >
            {title}
          </NavLink>
        ) : canToggle ? (
          <button
            type="button"
            className={textButtonClassName}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            aria-label={toggleLabel}
          >
            <span>{title}</span>
            <CollapseChevron collapsed={collapsed} />
          </button>
        ) : (
          <span className={textClassName}>{title}</span>
        )}

        {canToggle && hasTo && (
          <button
            type="button"
            className={[styles.sidebarCollapse, collapsed && "collapsed"].filter(Boolean).join(" ")}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
            aria-label={`${collapsed ? labels.sidebar.expand : labels.sidebar.collapse} ${title}`}
            aria-expanded={!collapsed}
            aria-controls={contentId}
          >
            <ChevronDownIcon size={16} />
          </button>
        )}
      </div>

      {hasChildren && (
        <div
          id={contentId}
          className={styles.sidebarCollapseWrapper}
          data-collapsed={collapsed}
          aria-hidden={collapsed}
          inert={collapsed}
        >
          <div className={styles.sidebarCollapseInner}>
            <ul className={`${styles.sidebarList} ${styles.sidebarList1}`}>{children}</ul>
          </div>
        </div>
      )}
    </li>
  )
}

// =============================================================================
// SidebarLink Component
// =============================================================================

export type ArdoSidebarLinkProps = {
  /** Internal route path (type-safe with React Router's registered routes) */
  to: RoutePath
  /** Link text */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Sidebar navigation link.
 *
 * @example
 * ```tsx
 * <SidebarLink to="/guide/getting-started">Getting Started</SidebarLink>
 * ```
 */
export function ArdoSidebarLink({ to, children, className }: ArdoSidebarLinkProps) {
  const baseClassName = className ?? styles.sidebarLink
  return (
    <li className={styles.sidebarItem}>
      <NavLink
        to={to}
        className={({ isActive }) =>
          [baseClassName, isActive && "active"].filter(Boolean).join(" ")
        }
      >
        {children}
      </NavLink>
    </li>
  )
}

// =============================================================================
// Internal: Data-driven sidebar rendering
// =============================================================================

type SidebarItemsProps = {
  items: SidebarItemType[]
  depth: number
}

function SidebarItems({ items, depth }: SidebarItemsProps) {
  // The tree treatment (icon-circle nodes threaded on a trunk line) only kicks
  // in for top-level lists that actually contain groups. Flat lists of single
  // links stay plain — the circles are a group marker, not a per-link bullet.
  const treeMode = depth === 0 && items.some((item) => (item.items?.length ?? 0) > 0)
  const depthClass = depth === 0 ? styles.sidebarList0 : styles.sidebarList1
  const listClassName = [styles.sidebarList, depthClass, treeMode && styles.sidebarTrunk]
    .filter(Boolean)
    .join(" ")
  return (
    <ul className={listClassName}>
      {items.map((item) => (
        <SidebarItemComponent
          key={item.link ?? `${item.text}-${String(depth)}`}
          item={item}
          depth={depth}
          treeMode={treeMode}
        />
      ))}
    </ul>
  )
}

type SidebarItemComponentProps = {
  item: SidebarItemType
  depth: number
  treeMode?: boolean
}

function SidebarItemComponent({ item, depth, treeMode = false }: SidebarItemComponentProps) {
  return depth === 0 && treeMode ? (
    <SidebarGroupNode item={item} depth={depth} />
  ) : (
    <SidebarLeafItem item={item} depth={depth} />
  )
}

type SidebarItemState = {
  collapsed: boolean
  toggle: () => void
  contentId: string
  childItems: SidebarItemType[]
  hasChildren: boolean
  hasActiveChild: boolean
  hasItemLink: boolean
  isSelfActive: boolean
}

function useSidebarItem(item: SidebarItemType): SidebarItemState {
  const { currentPath } = useSidebarContext()
  const [collapsed, setCollapsed] = useState(item.collapsed ?? false)
  const contentId = useId()
  const childItems = item.items ?? []
  const hasChildren = childItems.length > 0
  const hasActiveChild =
    hasChildren &&
    childItems.some(
      (child) =>
        child.link === currentPath ||
        child.items?.some((grandchild) => grandchild.link === currentPath)
    )
  const hasItemLink = (item.link ?? "") !== ""
  return {
    collapsed,
    toggle() {
      setCollapsed(!collapsed)
    },
    contentId,
    childItems,
    hasChildren,
    hasActiveChild,
    hasItemLink,
    isSelfActive: hasItemLink && item.link === currentPath,
  }
}

type ItemProps = {
  item: SidebarItemType
  depth: number
}

function sidebarItemClass(hasChildren: boolean) {
  return [styles.sidebarItem, hasChildren && styles.sidebarItemGroup].filter(Boolean).join(" ")
}

function toggleAria(collapsed: boolean, text: string) {
  return `${collapsed ? "Expand" : "Collapse"} ${text}`
}

/** Standalone chevron button shown alongside a linked (navigable) group title. */
function CollapseButton({
  item,
  state,
}: {
  item: SidebarItemType
  state: Pick<SidebarItemState, "collapsed" | "contentId" | "toggle">
}) {
  const labels = useArdoLabels()
  const { collapsed, toggle, contentId } = state
  return (
    <button
      type="button"
      className={[styles.sidebarCollapse, collapsed && "collapsed"].filter(Boolean).join(" ")}
      onClick={toggle}
      aria-label={`${collapsed ? labels.sidebar.expand : labels.sidebar.collapse} ${item.text}`}
      aria-expanded={!collapsed}
      aria-controls={contentId}
    >
      <ChevronDownIcon size={16} />
    </button>
  )
}

function SidebarItemChildren({
  state,
  depth,
}: {
  state: Pick<SidebarItemState, "childItems" | "collapsed" | "contentId">
  depth: number
}) {
  return (
    <div
      id={state.contentId}
      className={styles.sidebarCollapseWrapper}
      data-collapsed={state.collapsed}
      aria-hidden={state.collapsed}
      inert={state.collapsed}
    >
      <div className={styles.sidebarCollapseInner}>
        <SidebarItems items={state.childItems} depth={depth + 1} />
      </div>
    </div>
  )
}

/**
 * Top-level entry in tree mode: an icon circle plus title, wrapped in a capsule
 * that highlights when the section (or one of its children) is active.
 */
function SidebarGroupNode({ item, depth }: ItemProps) {
  const state = useSidebarItem(item)
  const { collapsed, toggle, contentId, hasChildren, hasActiveChild, hasItemLink, isSelfActive } =
    state
  const NodeIcon = hasChildren ? FolderIcon : FileTextIcon
  const capsuleState = isSelfActive ? "active" : hasActiveChild ? "child-active" : ""
  const headerClassName = [styles.sidebarNodeHeader, capsuleState].filter(Boolean).join(" ")

  return (
    <li className={sidebarItemClass(hasChildren)}>
      <div className={headerClassName}>
        <span className={styles.sidebarNode} aria-hidden="true">
          <NodeIcon size={15} strokeWidth={1.8} />
        </span>
        {hasItemLink ? (
          <NavLink to={item.link ?? "/"} end className={styles.sidebarNodeTitle}>
            {item.text}
          </NavLink>
        ) : hasChildren ? (
          <button
            type="button"
            className={styles.sidebarNodeTitle}
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            aria-label={toggleAria(collapsed, item.text)}
          >
            {item.text}
          </button>
        ) : (
          <span className={styles.sidebarNodeTitle}>{item.text}</span>
        )}
        {hasChildren &&
          (hasItemLink ? (
            <CollapseButton item={item} state={state} />
          ) : (
            <CollapseChevron collapsed={collapsed} />
          ))}
      </div>
      {hasChildren && <SidebarItemChildren state={state} depth={depth} />}
    </li>
  )
}

/** Plain link/section used for nested entries and flat (non-tree) top-level lists. */
function SidebarLeafItem({ item, depth }: ItemProps) {
  const state = useSidebarItem(item)
  const { collapsed, toggle, contentId, hasChildren, hasActiveChild, hasItemLink } = state
  const linkClassName = [styles.sidebarLink, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")
  const textClassName = [styles.sidebarText, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")

  return (
    <li className={sidebarItemClass(hasChildren)}>
      <div className={styles.sidebarItemHeader}>
        {hasItemLink ? (
          <NavLink
            to={item.link ?? "/"}
            end={hasChildren}
            className={({ isActive }) =>
              [linkClassName, isActive && "active"].filter(Boolean).join(" ")
            }
          >
            {item.text}
          </NavLink>
        ) : hasChildren ? (
          <button
            type="button"
            className={[textClassName, styles.sidebarTextButton].join(" ")}
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            aria-label={toggleAria(collapsed, item.text)}
          >
            <span>{item.text}</span>
            <CollapseChevron collapsed={collapsed} />
          </button>
        ) : (
          <span className={textClassName}>{item.text}</span>
        )}
        {hasChildren && hasItemLink && <CollapseButton item={item} state={state} />}
      </div>
      {hasChildren && <SidebarItemChildren state={state} depth={depth} />}
    </li>
  )
}

function CollapseChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <span
      className={[styles.sidebarToggleChevron, collapsed && "collapsed"].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <ChevronDownIcon size={16} />
    </span>
  )
}

// =============================================================================
// Utility Functions
// =============================================================================

function isSidebarChildActive(child: ReactElement, currentPath: string): boolean {
  if (isSidebarLinkElement(child)) {
    return child.props.to === currentPath
  }
  if (isSidebarGroupElement(child)) {
    const groupProps = child.props
    return (
      groupProps.to === currentPath ||
      (groupProps.children != null && checkChildrenActive(groupProps.children, currentPath))
    )
  }
  return false
}

function checkChildrenActive(children: ReactNode, currentPath: string): boolean {
  return Children.toArray(children).some(
    (child) => isValidElement(child) && isSidebarChildActive(child, currentPath)
  )
}

function isSidebarLinkElement(child: ReactElement): child is ReactElement<ArdoSidebarLinkProps> {
  return child.type === ArdoSidebarLink
}

function isSidebarGroupElement(child: ReactElement): child is ReactElement<ArdoSidebarGroupProps> {
  return child.type === ArdoSidebarGroup
}
