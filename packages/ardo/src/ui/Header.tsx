import { type ReactNode, useEffect, useState } from "react"
import { Link, useLocation } from "react-router"

import { useArdoConfig } from "../runtime/hooks"
import { ArdoSearch } from "./components/Search"
import { ArdoThemeToggle } from "./components/ThemeToggle"
import * as styles from "./Header.css"
import {
  GithubIcon,
  LinkedinIcon,
  MessageCircleIcon,
  PackageIcon,
  TwitterIcon,
  XIcon,
  YoutubeIcon,
} from "./icons"
import * as navStyles from "./Nav.css"

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
  const hasMobileMenu = mobileMenuContent != null

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  return (
    <>
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

          {nav != null && <div className={styles.desktopNav}>{nav}</div>}

          <div className={styles.headerRight}>
            {search && <ArdoSearch placeholder={searchPlaceholder} />}
            {themeToggle && <ArdoThemeToggle />}
            {actions}
          </div>
        </div>
      </header>

      {hasMobileMenu && (
        <MobileSlidePanel
          isOpen={mobileMenuOpen}
          logo={resolvedLogo}
          title={resolvedTitle}
          nav={nav}
          themeToggle={themeToggle}
          onClose={() => {
            setMobileMenuOpen(false)
          }}
        >
          {mobileMenuContent}
        </MobileSlidePanel>
      )}
    </>
  )
}

// =============================================================================
// Mobile Slide-in Panel
// =============================================================================

function MobileSlidePanel({
  isOpen,
  logo,
  title,
  nav,
  themeToggle,
  children,
  onClose,
}: {
  isOpen: boolean
  logo?: { light: string; dark: string } | string
  title: string
  nav?: ReactNode
  themeToggle?: boolean
  children: ReactNode
  onClose: () => void
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.mobileBackdrop}
        data-open={isOpen}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose()
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close menu"
      />

      {/* Panel */}
      <div className={styles.mobilePanel} data-open={isOpen} aria-hidden={!isOpen}>
        <div className={styles.mobilePanelHeader}>
          <Link to="/" className={styles.logoLink} onClick={onClose}>
            {logo != null && (
              <img
                src={typeof logo === "string" ? logo : logo.light}
                alt={title}
                className={styles.logo}
              />
            )}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {themeToggle && <ArdoThemeToggle />}
            <button
              type="button"
              className={styles.mobilePanelClose}
              onClick={onClose}
              aria-label="Close menu"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        {nav != null && (
          <div className={styles.mobilePanelNav} onClick={handleLinkClick(onClose)}>
            {nav}
          </div>
        )}

        {/* Sidebar content - wrapper overrides display:none from sidebar CSS */}
        <div className={styles.mobilePanelSidebar} onClick={handleLinkClick(onClose)}>
          {children}
        </div>
      </div>
    </>
  )
}

function handleLinkClick(onClose: () => void) {
  return (event: React.MouseEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("a") !== null) {
      onClose()
    }
  }
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
