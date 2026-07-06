import { type ComponentProps, createContext, type ReactNode, use, useMemo, useState } from "react"
import { NavLink as RouterNavLink, useLocation } from "react-router"

import * as styles from "./Nav.css"

/** Route path type - uses React Router's NavLink 'to' prop type for type-safe routes */
type RoutePath = ComponentProps<typeof RouterNavLink>["to"]

// Nav context for shared state
type NavContextValue = {
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

export type ArdoNavProps = {
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

export type ArdoNavLinkProps = {
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
export function ArdoNavLink({ to, href, children, className, activeMatch }: ArdoNavLinkProps) {
  const navContext = useNavContext()
  const { pathname } = useLocation()
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
          [baseClassName, (isActive || matchesActiveMatch(pathname, activeMatch)) && "active"]
            .filter(Boolean)
            .join(" ")
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

function matchesActiveMatch(pathname: string, activeMatch: string | undefined): boolean {
  if (activeMatch == null || activeMatch === "") {
    return false
  }

  try {
    return new RegExp(activeMatch, "u").test(pathname)
  } catch {
    return pathname.startsWith(activeMatch)
  }
}

// =============================================================================
// NavProvider Component
// =============================================================================

export type NavProviderProps = {
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
