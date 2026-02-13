import {
  useState,
  type ReactNode,
  type ComponentProps,
  Children,
  isValidElement,
  createContext,
  useContext,
} from "react"
import { NavLink, useLocation } from "react-router"
import { ChevronDownIcon } from "./icons"
import type { SidebarItem as SidebarItemType } from "../config/types"

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
  return useContext(SidebarContext)
}

// =============================================================================
// Sidebar Component Types
// =============================================================================

export interface SidebarProps {
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
 * Sidebar component supporting both data-driven and JSX composition patterns.
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
export function Sidebar({ items, children, className }: SidebarProps) {
  const { pathname } = useLocation()

  return (
    <SidebarContext.Provider value={{ currentPath: pathname }}>
      <aside className={className ?? "ardo-sidebar"}>
        <nav className="ardo-sidebar-nav" aria-label="Main navigation">
          {items ? (
            <SidebarItems items={items} depth={0} />
          ) : (
            <ul className="ardo-sidebar-list ardo-sidebar-list-0">{children}</ul>
          )}
        </nav>
      </aside>
    </SidebarContext.Provider>
  )
}

// =============================================================================
// SidebarGroup Component
// =============================================================================

export interface SidebarGroupProps {
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
export function SidebarGroup({
  title,
  to,
  collapsed: initialCollapsed = false,
  collapsible = true,
  children,
  className,
}: SidebarGroupProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const { currentPath } = useSidebarContext()

  // Check if any child is active
  const isChildActive = checkChildrenActive(children, currentPath)

  const textClassName = ["ardo-sidebar-text", isChildActive && "child-active"]
    .filter(Boolean)
    .join(" ")

  const hasChildren = Children.count(children) > 0

  return (
    <li className={className ?? "ardo-sidebar-item"}>
      <div className="ardo-sidebar-item-header">
        {to ? (
          <NavLink
            to={to}
            end
            className={({ isActive }) =>
              [textClassName, isActive && "active"].filter(Boolean).join(" ")
            }
          >
            {title}
          </NavLink>
        ) : (
          <span
            className={textClassName}
            onClick={() => collapsible && hasChildren && setCollapsed(!collapsed)}
            style={collapsible && hasChildren ? { cursor: "pointer" } : undefined}
          >
            {title}
          </span>
        )}

        {collapsible && hasChildren && (
          <button
            className={["ardo-sidebar-collapse", collapsed && "collapsed"]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronDownIcon size={16} />
          </button>
        )}
      </div>

      {hasChildren && !collapsed && (
        <ul className="ardo-sidebar-list ardo-sidebar-list-1">{children}</ul>
      )}
    </li>
  )
}

// =============================================================================
// SidebarLink Component
// =============================================================================

export interface SidebarLinkProps {
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
export function SidebarLink({ to, children, className }: SidebarLinkProps) {
  const baseClassName = className ?? "ardo-sidebar-link"
  return (
    <li className="ardo-sidebar-item">
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
    <ul className={`ardo-sidebar-list ardo-sidebar-list-${depth}`}>
      {items.map((item, index) => (
        <SidebarItemComponent key={index} item={item} depth={depth} />
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

  const hasChildren = item.items && item.items.length > 0

  const isChildActive =
    hasChildren &&
    item.items!.some(
      (child) =>
        child.link === currentPath ||
        (child.items && child.items.some((grandchild) => grandchild.link === currentPath))
    )

  const linkClassName = ["ardo-sidebar-link", isChildActive && "child-active"]
    .filter(Boolean)
    .join(" ")

  const textClassName = ["ardo-sidebar-text", isChildActive && "child-active"]
    .filter(Boolean)
    .join(" ")

  return (
    <li className="ardo-sidebar-item">
      <div className="ardo-sidebar-item-header">
        {item.link ? (
          <NavLink
            to={item.link}
            className={({ isActive }) =>
              [linkClassName, isActive && "active"].filter(Boolean).join(" ")
            }
          >
            {item.text}
          </NavLink>
        ) : (
          <span className={textClassName} onClick={() => hasChildren && setCollapsed(!collapsed)}>
            {item.text}
          </span>
        )}

        {hasChildren && (
          <button
            className={["ardo-sidebar-collapse", collapsed && "collapsed"]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronDownIcon size={16} />
          </button>
        )}
      </div>

      {hasChildren && !collapsed && <SidebarItems items={item.items!} depth={depth + 1} />}
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
      if (child.type === SidebarLink && (child.props as SidebarLinkProps).to === currentPath) {
        isActive = true
        return
      }

      // Check nested SidebarGroup
      if (child.type === SidebarGroup) {
        const groupProps = child.props as SidebarGroupProps
        if (groupProps.to === currentPath) {
          isActive = true
          return
        }
        if (groupProps.children && checkChildrenActive(groupProps.children, currentPath)) {
          isActive = true
          return
        }
      }
    }
  })

  return isActive
}
