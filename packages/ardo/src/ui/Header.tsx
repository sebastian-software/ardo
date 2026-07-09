import {
  type ChangeEvent,
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { Link, useLocation } from "react-router"

import { useArdoConfig, useArdoLabels } from "../runtime/hooks"
import { joinClassNames } from "./classnames"
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
import { getVersionedPath } from "./version-path"

// =============================================================================
// Header Component
// =============================================================================

export type ArdoHeaderProps = {
  /** Logo image URL or light/dark variants */
  logo?: ArdoLogo
  /** Site title displayed next to logo */
  title?: string
  /** Navigation and action children. Use ArdoHeaderActions for right-side actions. */
  children?: ReactNode
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

export type ArdoHeaderActionsProps = {
  /** Right-side header actions such as social links or custom buttons. */
  children?: ReactNode
}

export function ArdoHeaderActions({ children }: ArdoHeaderActionsProps) {
  return <>{children}</>
}

function compactNodes(nodes: ReactNode[]): ReactNode {
  if (nodes.length === 0) return undefined
  if (nodes.length === 1) return nodes[0]
  return <>{nodes}</>
}

function isHeaderActionsElement(child: ReactNode): child is ReactElement<ArdoHeaderActionsProps> {
  return isValidElement(child) && child.type === ArdoHeaderActions
}

function splitHeaderChildren(children: ReactNode): { actions: ReactNode; nav: ReactNode } {
  const navNodes: ReactNode[] = []
  const actionNodes: ReactNode[] = []

  for (const child of flattenHeaderChildren(children)) {
    if (isHeaderActionsElement(child)) {
      actionNodes.push(child.props.children)
    } else {
      navNodes.push(child)
    }
  }

  return { actions: compactNodes(actionNodes), nav: compactNodes(navNodes) }
}

function flattenHeaderChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = []
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      result.push(...flattenHeaderChildren(child.props.children))
    } else {
      result.push(child)
    }
  }
  return result
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
  children,
  search = true,
  searchPlaceholder,
  themeToggle = true,
  mobileMenuContent,
  className,
}: ArdoHeaderProps) {
  const config = useArdoConfig()
  const labels = useArdoLabels()
  const [mobileMenuOpen, setMobileMenuOpen] = useMobileMenu()
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const { actions, nav } = splitHeaderChildren(children)

  const resolvedLogo = logo
  const resolvedTitle = title ?? config.title
  const hasLogo = resolvedLogo !== undefined
  const hasTitle = resolvedTitle !== ""
  const hasMobileMenu = mobileMenuContent != null || nav != null
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [setMobileMenuOpen])

  return (
    <>
      <header className={joinClassNames("ardo-header", className ?? styles.header)}>
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
                aria-label={labels.header.toggleMenu}
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
            <ArdoVersionSwitcher />
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

function ArdoVersionSwitcher() {
  const config = useArdoConfig()
  const location = useLocation()
  const versioning = config.versioning
  if (versioning === false || versioning == null || versioning.versions.length < 2) {
    return null
  }

  const currentVersion = versioning.versions.find((version) => version.id === versioning.current)
  if (currentVersion == null) {
    return null
  }
  const activeVersioning = versioning
  const activeVersion = currentVersion

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const targetVersion = activeVersioning.versions.find(
      (version) => version.id === event.target.value
    )
    if (targetVersion == null || targetVersion.id === activeVersion.id) {
      return
    }

    const pathname = getVersionedPath(location.pathname, activeVersion.path, targetVersion.path)
    globalThis.location.assign(`${pathname}${location.search}${location.hash}`)
  }

  return (
    <select
      aria-label="Documentation version"
      className={styles.versionSwitcher}
      onChange={handleChange}
      title="Documentation version"
      value={activeVersion.id}
    >
      {activeVersioning.versions.map((version) => (
        <option key={version.id} value={version.id}>
          {version.label ?? version.id}
        </option>
      ))}
    </select>
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
