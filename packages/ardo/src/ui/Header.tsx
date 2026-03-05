import { lazy, type MouseEvent, type ReactNode, Suspense, useEffect, useState } from "react"
import { Link, useLocation } from "react-router"

import { useArdoConfig } from "../runtime/hooks"
import { ArdoThemeToggle } from "./components/ThemeToggle"
import * as styles from "./Header.css"
import {
  GithubIcon,
  LinkedinIcon,
  MessageCircleIcon,
  PackageIcon,
  TwitterIcon,
  YoutubeIcon,
} from "./icons"
import * as navStyles from "./Nav.css"

const LazySearch = lazy(() =>
  import("./components/Search").then((m) => ({ default: m.ArdoSearch }))
)

// =============================================================================
// Header Component
// =============================================================================

export interface ArdoHeaderProps {
  /** Logo image URL or light/dark variants */
  logo?: { light: string; dark: string } | string
  /** Site title displayed next to logo */
  title?: string
  /** Navigation content (Nav component or custom) */
  nav?: ReactNode
  /** Actions/right side content (social links, custom buttons) */
  actions?: ReactNode
  /** Show search (default: true) */
  search?: boolean
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** Show theme toggle (default: true) */
  themeToggle?: boolean
  /** Additional content rendered in the mobile menu (e.g. sidebar) */
  mobileMenuContent?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Header component with explicit slot props.
 *
 * Automatically pulls `title` from config. Props serve as overrides.
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
export function ArdoHeader({
  logo,
  title,
  nav,
  actions,
  search = true,
  searchPlaceholder,
  themeToggle = true,
  mobileMenuContent,
  className,
}: ArdoHeaderProps) {
  const location = useLocation()
  const config = useArdoConfig()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const resolvedLogo = logo
  const resolvedTitle = title ?? config.title

  const hasMobileMenu = Boolean(mobileMenuContent)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleMobileMenuClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest("a")) {
      setMobileMenuOpen(false)
    }
  }

  return (
    <header className={className ?? styles.header}>
      <div className={styles.headerContainer}>
        {/* Left: Mobile menu button + Logo/Title */}
        <div className={styles.headerLeft}>
          {hasMobileMenu && (
            <button
              type="button"
              className={styles.mobileMenuButton}
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen)
              }}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={styles.hamburger}>
                <span />
                <span />
                <span />
              </span>
            </button>
          )}

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
        {nav && <div className={styles.desktopNav}>{nav}</div>}

        {/* Right: Search, Theme Toggle, Actions */}
        <div className={styles.headerRight}>
          {search && (
            <Suspense fallback={<span />}>
              <LazySearch placeholder={searchPlaceholder} />
            </Suspense>
          )}
          {themeToggle && <ArdoThemeToggle />}
          {actions}
        </div>
      </div>

      {nav && (
        <div className={styles.mobileTopNav}>
          <div>{nav}</div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && hasMobileMenu && (
        <div className={styles.mobileMenu}>
          {mobileMenuContent && (
            <div
              className={`${styles.mobileMenuContent} ${styles.mobileMenuSection}`}
              onClick={handleMobileMenuClick}
            >
              {mobileMenuContent}
            </div>
          )}
        </div>
      )}
    </header>
  )
}

// =============================================================================
// SocialLink Component
// =============================================================================

export interface ArdoSocialLinkProps {
  /** URL to link to */
  href: string
  /** Social icon type */
  icon: "discord" | "github" | "linkedin" | "npm" | "twitter" | "youtube"
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
export function ArdoSocialLink({ href, icon, ariaLabel, className }: ArdoSocialLinkProps) {
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
