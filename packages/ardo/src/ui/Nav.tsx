import { type ReactNode, useState, createContext, useContext } from "react"
import { Link } from "@tanstack/react-router"

// Nav context for shared state
interface NavContextValue {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const NavContext = createContext<NavContextValue | null>(null)

function useNavContext() {
  return useContext(NavContext)
}

// =============================================================================
// Nav Component
// =============================================================================

export interface NavProps {
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
export function Nav({ children, className }: NavProps) {
  return <nav className={className ?? "ardo-nav"}>{children}</nav>
}

// =============================================================================
// NavLink Component
// =============================================================================

export interface NavLinkProps {
  /** Internal route path (uses TanStack Router Link) */
  to?: string
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
export function NavLink({ to, href, children, className, activeMatch }: NavLinkProps) {
  const navContext = useNavContext()
  const baseClassName = className ?? "ardo-nav-link"

  // Handle click for mobile menu
  const handleClick = () => {
    navContext?.setMobileMenuOpen(false)
  }

  // External link
  if (href) {
    return (
      <a
        href={href}
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
  if (to) {
    return (
      <Link
        to={to}
        className={baseClassName}
        activeProps={{ className: "active" }}
        activeOptions={activeMatch ? { exact: false } : { exact: false }}
        onClick={handleClick}
      >
        {children}
      </Link>
    )
  }

  // Text-only (no link)
  return <span className={baseClassName}>{children}</span>
}

// =============================================================================
// NavDropdown Component
// =============================================================================

export interface NavDropdownProps {
  /** Dropdown trigger text */
  text: string
  /** Dropdown items */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Dropdown navigation menu for grouping related links.
 *
 * @example
 * ```tsx
 * <NavDropdown text="Resources">
 *   <NavLink to="/docs">Documentation</NavLink>
 *   <NavLink to="/blog">Blog</NavLink>
 * </NavDropdown>
 * ```
 */
export function NavDropdown({ text, children, className }: NavDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={className ?? "ardo-nav-dropdown"}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="ardo-nav-dropdown-button">
        {text}
        <span className="ardo-nav-dropdown-icon">▼</span>
      </button>
      {open && <div className="ardo-nav-dropdown-menu">{children}</div>}
    </div>
  )
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

  return (
    <NavContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </NavContext.Provider>
  )
}

// Export context hook for external use
export { useNavContext }
