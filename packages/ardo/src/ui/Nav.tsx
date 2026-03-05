import { type ComponentProps, createContext, type ReactNode, use, useMemo, useState } from "react"
import { NavLink as RouterNavLink } from "react-router"

import * as styles from "./Nav.css"

/** Route path type - uses React Router's NavLink 'to' prop type for type-safe routes */
type RoutePath = ComponentProps<typeof RouterNavLink>["to"]

// Nav context for shared state
interface NavContextValue {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const NavContext = createContext<NavContextValue | null>(null)

function useNavContext() {
  return use(NavContext)
}

// =============================================================================
// Nav Component
// =============================================================================

export interface ArdoNavProps {
  children?: ReactNode
  className?: string
}

/**
 * Navigation container component for composing navigation links.
 *
 * @example
 * ```tsx
 * <Nav>
 *   <NavLink to="/guide">Guide</NavLink>
 *   <NavLink to="/api">API</NavLink>
 *   <NavLink href="https://github.com/...">GitHub</NavLink>
 * </Nav>
 * ```
 */
export function ArdoNav({ children, className }: ArdoNavProps) {
  return <nav className={className ?? styles.nav}>{children}</nav>
}

// =============================================================================
// NavLink Component
// =============================================================================

export interface ArdoNavLinkProps {
  /** Internal route path (type-safe with React Router's registered routes) */
  to?: RoutePath
  /** External URL (uses anchor tag) */
  href?: string
  /** Link text or children */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Active state match pattern */
  activeMatch?: string
}

/**
 * Navigation link component supporting both internal routes and external URLs.
 *
 * @example
 * ```tsx
 * // Internal link
 * <NavLink to="/guide">Guide</NavLink>
 *
 * // External link
 * <NavLink href="https://github.com/...">GitHub</NavLink>
 * ```
 */
export function ArdoNavLink({
  to,
  href,
  children,
  className,
  activeMatch: _activeMatch,
}: ArdoNavLinkProps) {
  const navContext = useNavContext()
  const baseClassName = className ?? styles.navLink
  const hasHref = (href ?? "") !== ""
  const hasTo = to !== undefined

  // Handle click for mobile menu
  const handleClick = () => {
    navContext?.setMobileMenuOpen(false)
  }

  // External link
  if (hasHref) {
    return (
      <a
        href={href ?? ""}
        className={baseClassName}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        {children}
      </a>
    )
  }

  // Internal link
  if (hasTo) {
    return (
      <RouterNavLink
        to={to}
        className={({ isActive }: { isActive: boolean }) =>
          [baseClassName, isActive && "active"].filter(Boolean).join(" ")
        }
        onClick={handleClick}
      >
        {children}
      </RouterNavLink>
    )
  }

  // Text-only (no link)
  return <span className={baseClassName}>{children}</span>
}

// =============================================================================
// NavProvider Component
// =============================================================================

export interface NavProviderProps {
  children: ReactNode
}

/**
 * Provider for Nav context (mobile menu state).
 * Used internally by Header component.
 */
export function NavProvider({ children }: NavProviderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const contextValue = useMemo(() => ({ mobileMenuOpen, setMobileMenuOpen }), [mobileMenuOpen])

  return <NavContext value={contextValue}>{children}</NavContext>
}

// Export context hook for external use
export { useNavContext }
