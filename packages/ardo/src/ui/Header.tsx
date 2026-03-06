import {
  type KeyboardEvent,
  lazy,
  type MouseEvent,
  type ReactNode,
  Suspense,
  useEffect,
  useState,
} from "react"
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
  const hasLogo = resolvedLogo !== undefined
  const hasTitle = resolvedTitle !== ""
  const hasNav = nav != null
  const hasMobileMenu = mobileMenuContent != null

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <header className={className ?? styles.header}>
      <div className={styles.headerContainer}>
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
            {hasLogo && (
              <img
                src={typeof resolvedLogo === "string" ? resolvedLogo : resolvedLogo.light}
                alt={resolvedTitle}
                className={styles.logo}
              />
            )}
            {hasTitle && <span className={styles.siteTitle}>{resolvedTitle}</span>}
          </Link>
        </div>

        {hasNav && <div className={styles.desktopNav}>{nav}</div>}

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

      {hasNav && (
        <div className={styles.mobileTopNav}>
          <div>{nav}</div>
        </div>
      )}

      <MobileMenu
        isOpen={mobileMenuOpen}
        content={mobileMenuContent}
        onClose={() => {
          setMobileMenuOpen(false)
        }}
      />
    </header>
  )
}

function MobileMenu({
  isOpen,
  content,
  onClose,
}: {
  isOpen: boolean
  content: ReactNode
  onClose: () => void
}) {
  if (!isOpen || content == null) return null
  const handleInteraction = (event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("a") !== null) {
      onClose()
    }
  }
  return (
    <div className={styles.mobileMenu}>
      <div
        className={`${styles.mobileMenuContent} ${styles.mobileMenuSection}`}
        onClick={handleInteraction}
        onKeyDown={handleInteraction}
      >
        {content}
      </div>
    </div>
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

function SocialIcon({ icon }: { icon: keyof typeof socialIcons }) {
  const IconComponent = socialIcons[icon]
  return <IconComponent size={20} />
}
