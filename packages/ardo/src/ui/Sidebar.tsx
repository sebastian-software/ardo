import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactNode,
  use,
  useMemo,
  useState,
} from "react"
import { NavLink, useLocation } from "react-router"

import type { SidebarItem as SidebarItemType } from "../config/types"

import { useArdoSidebar } from "../runtime/hooks"
import { ChevronDownIcon } from "./icons"
import * as styles from "./Sidebar.css"

/** Route path type - uses React Router's NavLink 'to' prop type for type-safe routes */
type RoutePath = ComponentProps<typeof NavLink>["to"]

// =============================================================================
// Sidebar Context
// =============================================================================

interface SidebarContextValue {
  currentPath: string
}

const SidebarContext = createContext<SidebarContextValue>({ currentPath: "" })

function useSidebarContext() {
  return use(SidebarContext)
}

// =============================================================================
// Sidebar Component Types
// =============================================================================

export interface ArdoSidebarProps {
  /** Sidebar items (for data-driven approach) */
  items?: SidebarItemType[]
  /** Children for JSX composition (SidebarGroup, SidebarLink) */
  children?: ReactNode
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
export function ArdoSidebar({ items, children, className }: ArdoSidebarProps) {
  const { pathname } = useLocation()
  const contextSidebar = useArdoSidebar()
  const hasCustomChildren = children != null
  const resolvedItems = items ?? (hasCustomChildren ? undefined : contextSidebar)
  const hasResolvedItems = (resolvedItems?.length ?? 0) > 0
  const contextValue = useMemo(() => ({ currentPath: pathname }), [pathname])

  return (
    <SidebarContext value={contextValue}>
      <aside className={className ?? styles.sidebar}>
        <nav aria-label="Main navigation">
          {hasCustomChildren ? (
            <ul className={`${styles.sidebarList} ${styles.sidebarList0}`}>{children}</ul>
          ) : hasResolvedItems ? (
            <SidebarItems items={resolvedItems} depth={0} />
          ) : null}
        </nav>
      </aside>
    </SidebarContext>
  )
}

// =============================================================================
// SidebarGroup Component
// =============================================================================

export interface ArdoSidebarGroupProps {
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
  const { currentPath } = useSidebarContext()

  // Check if any child is active
  const isChildActive = checkChildrenActive(children, currentPath)

  const textClassName = [styles.sidebarText, isChildActive && "child-active"]
    .filter(Boolean)
    .join(" ")

  const hasChildren = Children.count(children) > 0
  const hasTo = (to ?? "") !== ""
  const canToggle = collapsible && hasChildren

  return (
    <li className={className ?? styles.sidebarItem}>
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
            className={textClassName}
            onClick={() => {
              if (canToggle) {
                setCollapsed(!collapsed)
              }
            }}
            style={canToggle ? { cursor: "pointer" } : undefined}
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

      {hasChildren && !collapsed && (
        <ul className={`${styles.sidebarList} ${styles.sidebarList1}`}>{children}</ul>
      )}
    </li>
  )
}

// =============================================================================
// SidebarLink Component
// =============================================================================

export interface ArdoSidebarLinkProps {
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

interface SidebarItemsProps {
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

interface SidebarItemComponentProps {
  item: SidebarItemType
  depth: number
}

function SidebarItemComponent({ item, depth }: SidebarItemComponentProps) {
  const { currentPath } = useSidebarContext()
  const [collapsed, setCollapsed] = useState(item.collapsed ?? false)
  const childItems = item.items ?? []

  const hasChildren = childItems.length > 0

  const isChildActive =
    hasChildren &&
    childItems.some(
      (child) =>
        child.link === currentPath ||
        child.items?.some((grandchild) => grandchild.link === currentPath)
    )
  const hasItemLink = (item.link ?? "") !== ""

  const linkClassName = [styles.sidebarLink, isChildActive && "child-active"]
    .filter(Boolean)
    .join(" ")

  const textClassName = [styles.sidebarText, isChildActive && "child-active"]
    .filter(Boolean)
    .join(" ")

  return (
    <li className={styles.sidebarItem}>
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
            className={textClassName}
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

      {hasChildren && !collapsed && <SidebarItems items={childItems} depth={depth + 1} />}
    </li>
  )
}

// =============================================================================
// Utility Functions
// =============================================================================

function checkChildrenActive(children: ReactNode, currentPath: string): boolean {
  let isActive = false

  Children.forEach(children, (child) => {
    if (isActive) return

    if (isValidElement(child)) {
      // Check SidebarLink
      if (
        child.type === ArdoSidebarLink &&
        (child.props as ArdoSidebarLinkProps).to === currentPath
      ) {
        isActive = true
        return
      }

      // Check nested SidebarGroup
      if (child.type === ArdoSidebarGroup) {
        const groupProps = child.props as ArdoSidebarGroupProps
        if (groupProps.to === currentPath) {
          isActive = true
          return
        }
        const hasGroupChildren = groupProps.children != null
        if (hasGroupChildren && checkChildrenActive(groupProps.children, currentPath)) {
          isActive = true
        }
      }
    }
  })

  return isActive
}
