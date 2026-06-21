/* eslint-disable max-lines */
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  use,
  useMemo,
  useState,
} from "react"
import { NavLink, useLocation } from "react-router"

import type { SidebarItem as SidebarItemType } from "../config/types"

import { useArdoContexts, useArdoSidebar } from "../runtime/hooks"
import { ChevronDownIcon } from "./icons"
import * as styles from "./Sidebar.css"
import {
  getContextRailItems,
  getDataRailItems,
  getTextLabel,
  SidebarRail,
  type SidebarRailItem,
} from "./SidebarRail"

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
  const contextSidebar = useArdoSidebar()
  const { items: contexts, activeId } = useArdoContexts()
  const hasCustomChildren = children != null
  const resolvedItems = items ?? (hasCustomChildren ? undefined : contextSidebar)
  const hasResolvedItems = (resolvedItems?.length ?? 0) > 0
  // If contexts are configured, the rail is the world-switcher; otherwise
  // fall back to the legacy "mirror sidebar sections as icons" behaviour.
  const railItems =
    contexts.length > 0
      ? getContextRailItems(contexts, activeId)
      : hasCustomChildren
        ? getRailItemsFromChildren(children, pathname)
        : getDataRailItems(resolvedItems ?? [], pathname)
  const contextValue = useMemo(() => ({ currentPath: pathname }), [pathname])

  return (
    <SidebarContext value={contextValue}>
      <aside className={className ?? styles.sidebar}>
        <SidebarRail items={railItems} />
        <div className={styles.sidebarPanel}>
          {header != null && <div className={styles.sidebarHeader}>{header}</div>}
          <nav aria-label="Main navigation" className={styles.sidebarNav}>
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
  /** Optional icon shown in the desktop section rail */
  icon?: ReactNode
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
  const { currentPath } = useSidebarContext()

  // Check if any child is active
  const hasActiveChild = checkChildrenActive(children, currentPath)

  const textClassName = [styles.sidebarText, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")
  const textButtonClassName = [textClassName, styles.sidebarTextButton].join(" ")

  const hasChildren = Children.count(children) > 0
  const hasTo = (to ?? "") !== ""
  const canToggle = collapsible && hasChildren

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
        ) : (
          <button
            type="button"
            className={textButtonClassName}
            onClick={() => {
              if (canToggle) {
                setCollapsed(!collapsed)
              }
            }}
          >
            {title}
          </button>
        )}

        {canToggle && (
          <button
            type="button"
            className={[styles.sidebarCollapse, collapsed && "collapsed"].filter(Boolean).join(" ")}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronDownIcon size={16} />
          </button>
        )}
      </div>

      {hasChildren && (
        <div className={styles.sidebarCollapseWrapper} data-collapsed={collapsed}>
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
  return (
    <ul
      className={`${styles.sidebarList} ${depth === 0 ? styles.sidebarList0 : styles.sidebarList1}`}
    >
      {items.map((item) => (
        <SidebarItemComponent
          key={item.link ?? `${item.text}-${String(depth)}`}
          item={item}
          depth={depth}
        />
      ))}
    </ul>
  )
}

type SidebarItemComponentProps = {
  item: SidebarItemType
  depth: number
}

function SidebarItemComponent({ item, depth }: SidebarItemComponentProps) {
  const { currentPath } = useSidebarContext()
  const [collapsed, setCollapsed] = useState(item.collapsed ?? false)
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

  const linkClassName = [styles.sidebarLink, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")

  const textClassName = [styles.sidebarText, hasActiveChild && "child-active"]
    .filter(Boolean)
    .join(" ")
  const textButtonClassName = [textClassName, styles.sidebarTextButton].join(" ")

  const itemClassName = [styles.sidebarItem, hasChildren && styles.sidebarItemGroup]
    .filter(Boolean)
    .join(" ")

  return (
    <li className={itemClassName}>
      <div className={styles.sidebarItemHeader}>
        {hasItemLink ? (
          <NavLink
            to={item.link ?? "/"}
            className={({ isActive }) =>
              [linkClassName, isActive && "active"].filter(Boolean).join(" ")
            }
          >
            {item.text}
          </NavLink>
        ) : (
          <button
            type="button"
            className={textButtonClassName}
            onClick={() => {
              if (hasChildren) {
                setCollapsed(!collapsed)
              }
            }}
          >
            {item.text}
          </button>
        )}

        {hasChildren && (
          <button
            type="button"
            className={[styles.sidebarCollapse, collapsed && "collapsed"].filter(Boolean).join(" ")}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronDownIcon size={16} />
          </button>
        )}
      </div>

      {hasChildren && (
        <div className={styles.sidebarCollapseWrapper} data-collapsed={collapsed}>
          <div className={styles.sidebarCollapseInner}>
            <SidebarItems items={childItems} depth={depth + 1} />
          </div>
        </div>
      )}
    </li>
  )
}

// =============================================================================
// Sidebar Rail Data
// =============================================================================

function getRailItemsFromChildren(children: ReactNode, currentPath: string): SidebarRailItem[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child, index): SidebarRailItem | undefined => {
      if (isSidebarGroupElement(child)) {
        const { title, to, icon } = child.props
        return {
          key: to ?? title,
          label: title,
          to: to ?? findFirstChildLink(child.props.children),
          icon,
          active: to === currentPath || checkChildrenActive(child.props.children, currentPath),
        }
      }

      if (isSidebarLinkElement(child)) {
        const label = getTextLabel(child.props.children, `Section ${String(index + 1)}`)
        return {
          key: `${label}-${String(index)}`,
          label,
          to: child.props.to,
          active: child.props.to === currentPath,
        }
      }

      return undefined
    })
    .filter((item): item is SidebarRailItem => item !== undefined)
}

function findFirstChildLink(children: ReactNode): RoutePath | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue
    if (isSidebarLinkElement(child)) return child.props.to
    if (isSidebarGroupElement(child)) return findFirstGroupLink(child)
  }
  return undefined
}

function findFirstGroupLink(child: ReactElement<ArdoSidebarGroupProps>): RoutePath | undefined {
  if ((child.props.to ?? "") !== "") return child.props.to
  return findFirstChildLink(child.props.children)
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
