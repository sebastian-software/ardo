import { useState, lazy, Suspense, type ReactNode } from "react"
import { Link, NavLink as RouterNavLink } from "react-router"
import * as styles from "./Header.css"
import * as navStyles from "./Nav.css"
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
import type { NavItem } from "../config/types"

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
 * <Header />
 *
 * @example With overrides
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
    <header className={className ?? styles.header}>
      <div className={styles.headerContainer}>
        {/* Left: Mobile menu button + Logo/Title */}
        <div className={styles.headerLeft}>
          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={styles.hamburger}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <Link to="/" className={styles.logoLink}>
            {resolvedLogo && (
              <img
                src={typeof resolvedLogo === "string" ? resolvedLogo : resolvedLogo.light}
                alt={resolvedTitle ?? "Logo"}
                className={styles.logo}
              />
            )}
            {resolvedTitle && <span className={styles.siteTitle}>{resolvedTitle}</span>}
          </Link>
        </div>

        {/* Center: Navigation */}
        {resolvedNav && <div className={styles.desktopNav}>{resolvedNav}</div>}

        {/* Right: Search, Theme Toggle, Actions */}
        <div className={styles.headerRight}>
          {search && (
            <Suspense fallback={<span />}>
              <LazySearch />
            </Suspense>
          )}
          {themeToggle && <ThemeToggle />}
          {resolvedActions}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav} onClick={() => setMobileMenuOpen(false)}>
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
 * <SocialLink href="https://github.com/..." icon="github" />
 */
export function SocialLink({ href, icon, ariaLabel, className }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? navStyles.socialLink}
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
    <nav className={navStyles.nav}>
      {items.map((item, i) => (
        <AutoNavItem key={i} item={item} />
      ))}
    </nav>
  )
}

function AutoNavItem({ item }: { item: NavItem }) {
  if (item.link?.startsWith("http")) {
    return (
      <a href={item.link} className={navStyles.navLink} target="_blank" rel="noopener noreferrer">
        {item.text}
      </a>
    )
  }

  if (item.link) {
    return (
      <RouterNavLink
        to={item.link}
        className={({ isActive }: { isActive: boolean }) =>
          [navStyles.navLink, isActive && "active"].filter(Boolean).join(" ")
        }
      >
        {item.text}
      </RouterNavLink>
    )
  }

  return <span className={navStyles.navLink}>{item.text}</span>
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
