import { useState, lazy, Suspense, type ReactNode } from "react"
import { Link } from "react-router"
import {
  GithubIcon,
  TwitterIcon,
  MessageCircleIcon,
  LinkedinIcon,
  YoutubeIcon,
  PackageIcon,
} from "./icons"
import { ThemeToggle } from "./components/ThemeToggle"

const LazySearch = lazy(() => import("./components/Search").then((m) => ({ default: m.Search })))

// =============================================================================
// Header Component
// =============================================================================

export interface HeaderProps {
  /** Logo image URL or light/dark variants */
  logo?: string | { light: string; dark: string }
  /** Site title displayed next to logo */
  title?: string
  /** Navigation content (Nav component or custom) */
  nav?: ReactNode
  /** Actions/right side content (social links, custom buttons) */
  actions?: ReactNode
  /** Show search (default: true) */
  search?: boolean
  /** Show theme toggle (default: true) */
  themeToggle?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Header component with explicit slot props.
 *
 * @example
 * ```tsx
 * <Header
 *   logo="/logo.svg"
 *   title="Ardo"
 *   nav={
 *     <Nav>
 *       <NavLink to="/guide">Guide</NavLink>
 *       <NavLink to="/api">API</NavLink>
 *     </Nav>
 *   }
 *   actions={
 *     <SocialLink href="https://github.com/..." icon="github" />
 *   }
 * />
 * ```
 */
export function Header({
  logo,
  title,
  nav,
  actions,
  search = true,
  themeToggle = true,
  className,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className={className ?? "ardo-header"}>
      <div className="ardo-header-container">
        {/* Left: Mobile menu button + Logo/Title */}
        <div className="ardo-header-left">
          <button
            className="ardo-mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="ardo-hamburger">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <Link to="/" className="ardo-logo-link">
            {logo && (
              <img
                src={typeof logo === "string" ? logo : logo.light}
                alt={title ?? "Logo"}
                className="ardo-logo"
              />
            )}
            {title && <span className="ardo-site-title">{title}</span>}
          </Link>
        </div>

        {/* Center: Navigation */}
        {nav && <div className="ardo-nav">{nav}</div>}

        {/* Right: Search, Theme Toggle, Actions */}
        <div className="ardo-header-right">
          {search && (
            <Suspense fallback={<span className="ardo-search-placeholder" />}>
              <LazySearch />
            </Suspense>
          )}
          {themeToggle && <ThemeToggle />}
          {actions}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="ardo-mobile-menu">
          <nav className="ardo-mobile-nav" onClick={() => setMobileMenuOpen(false)}>
            {nav}
          </nav>
        </div>
      )}
    </header>
  )
}

// =============================================================================
// SocialLink Component
// =============================================================================

export interface SocialLinkProps {
  /** URL to link to */
  href: string
  /** Social icon type */
  icon: "github" | "twitter" | "discord" | "linkedin" | "youtube" | "npm"
  /** Accessible label */
  ariaLabel?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Social media link with icon.
 *
 * @example
 * ```tsx
 * <SocialLink href="https://github.com/..." icon="github" />
 * ```
 */
export function SocialLink({ href, icon, ariaLabel, className }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "ardo-social-link"}
      aria-label={ariaLabel ?? icon}
    >
      <SocialIcon icon={icon} />
    </a>
  )
}

// =============================================================================
// Social Icon Component (internal)
// =============================================================================

const socialIcons = {
  github: GithubIcon,
  twitter: TwitterIcon,
  discord: MessageCircleIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
  npm: PackageIcon,
} as const

function SocialIcon({ icon }: { icon: string }) {
  const IconComponent = socialIcons[icon as keyof typeof socialIcons] ?? GithubIcon
  return <IconComponent size={20} />
}
