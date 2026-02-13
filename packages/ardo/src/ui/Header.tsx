import { useState, lazy, Suspense, type ReactNode } from "react"
import { Link, NavLink as RouterNavLink } from "react-router"
import {
  GithubIcon,
  TwitterIcon,
  MessageCircleIcon,
  LinkedinIcon,
  YoutubeIcon,
  PackageIcon,
} from "./icons"
import { ThemeToggle } from "./components/ThemeToggle"
import { useConfig, useThemeConfig } from "../runtime/hooks"
import type { NavItem, SocialLink as SocialLinkConfig } from "../config/types"

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
 * Automatically pulls `title` from config and `logo`/`siteTitle` from themeConfig.
 * Props serve as overrides.
 *
 * @example Zero-config
 * ```tsx
 * <Header />
 * ```
 *
 * @example With overrides
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
  const config = useConfig()
  const themeConfig = useThemeConfig()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const resolvedLogo = logo ?? themeConfig.logo
  const resolvedTitle =
    title ?? (themeConfig.siteTitle !== false ? (themeConfig.siteTitle ?? config.title) : undefined)

  // Auto-render nav from themeConfig.nav when no nav prop given
  const resolvedNav =
    nav ?? (themeConfig.nav?.length ? <AutoNav items={themeConfig.nav} /> : undefined)

  // Auto-render social links from themeConfig.socialLinks when no actions prop given
  const resolvedActions =
    actions ??
    (themeConfig.socialLinks?.length
      ? themeConfig.socialLinks.map((link, i) => (
          <SocialLink key={i} href={link.link} icon={link.icon} ariaLabel={link.ariaLabel} />
        ))
      : undefined)

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
            {resolvedLogo && (
              <img
                src={typeof resolvedLogo === "string" ? resolvedLogo : resolvedLogo.light}
                alt={resolvedTitle ?? "Logo"}
                className="ardo-logo"
              />
            )}
            {resolvedTitle && <span className="ardo-site-title">{resolvedTitle}</span>}
          </Link>
        </div>

        {/* Center: Navigation */}
        {resolvedNav && <div className="ardo-nav">{resolvedNav}</div>}

        {/* Right: Search, Theme Toggle, Actions */}
        <div className="ardo-header-right">
          {search && (
            <Suspense fallback={<span className="ardo-search-placeholder" />}>
              <LazySearch />
            </Suspense>
          )}
          {themeToggle && <ThemeToggle />}
          {resolvedActions}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="ardo-mobile-menu">
          <nav className="ardo-mobile-nav" onClick={() => setMobileMenuOpen(false)}>
            {resolvedNav}
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
// Auto Nav Component (internal, renders from NavItem[])
// =============================================================================

function AutoNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="ardo-nav">
      {items.map((item, i) => (
        <AutoNavItem key={i} item={item} />
      ))}
    </nav>
  )
}

function AutoNavItem({ item }: { item: NavItem }) {
  if (item.link?.startsWith("http")) {
    return (
      <a href={item.link} className="ardo-nav-link" target="_blank" rel="noopener noreferrer">
        {item.text}
      </a>
    )
  }

  if (item.link) {
    return (
      <RouterNavLink
        to={item.link}
        className={({ isActive }: { isActive: boolean }) =>
          ["ardo-nav-link", isActive && "active"].filter(Boolean).join(" ")
        }
      >
        {item.text}
      </RouterNavLink>
    )
  }

  return <span className="ardo-nav-link">{item.text}</span>
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
