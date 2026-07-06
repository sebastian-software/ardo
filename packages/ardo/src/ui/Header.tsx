import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router"

import { useArdoConfig } from "../runtime/hooks"
import { ArdoHeaderSearch } from "./components/HeaderSearch"
import { ArdoThemeToggle } from "./components/ThemeToggle"
import * as styles from "./Header.css"
import { type ArdoLogo, HeaderLogo } from "./HeaderLogo"
import {
  GithubIcon,
  LinkedinIcon,
  MessageCircleIcon,
  NpmIcon,
  TwitterIcon,
  YoutubeIcon,
} from "./icons"
import { MobileSlidePanel } from "./MobileSlidePanel"
import * as navStyles from "./Nav.css"

// =============================================================================
// Header Component
// =============================================================================

export type ArdoHeaderProps = {
  /** Logo image URL or light/dark variants */
  logo?: ArdoLogo
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
 * Mobile menu open state — resets on navigation and locks body scroll
 * while open.
 */
function useMobileMenu(): [boolean, (open: boolean) => void] {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return [open, setOpen]
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
  const config = useArdoConfig()
  const [mobileMenuOpen, setMobileMenuOpen] = useMobileMenu()
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)

  const resolvedLogo = logo
  const resolvedTitle = title ?? config.title
  const hasLogo = resolvedLogo !== undefined
  const hasTitle = resolvedTitle !== ""
  const hasMobileMenu = mobileMenuContent != null
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [setMobileMenuOpen])

  return (
    <>
      <header className={className ?? styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.headerLeft}>
            {hasMobileMenu && (
              <button
                ref={mobileMenuButtonRef}
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
              {hasLogo && <HeaderLogo logo={resolvedLogo} alt={resolvedTitle} />}
              {hasTitle && <span className={styles.siteTitle}>{resolvedTitle}</span>}
            </Link>
          </div>

          {search && (
            <div className={styles.headerCenter}>
              <ArdoHeaderSearch placeholder={searchPlaceholder} />
            </div>
          )}

          <div className={styles.headerRight}>
            {nav != null && <div className={styles.desktopNav}>{nav}</div>}
            {themeToggle && <ArdoThemeToggle />}
            {actions}
          </div>
        </div>
      </header>

      {hasMobileMenu && mobileMenuOpen && (
        <MobileSlidePanel
          logo={resolvedLogo}
          title={resolvedTitle}
          nav={nav}
          themeToggle={themeToggle}
          triggerRef={mobileMenuButtonRef}
          onClose={closeMobileMenu}
        >
          {mobileMenuContent}
        </MobileSlidePanel>
      )}
    </>
  )
}

// =============================================================================
// SocialLink Component
// =============================================================================

export type ArdoSocialLinkProps = {
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
  npm: NpmIcon,
} as const

function SocialIcon({ icon }: { icon: keyof typeof socialIcons }) {
  const IconComponent = socialIcons[icon]
  return <IconComponent size={20} />
}
