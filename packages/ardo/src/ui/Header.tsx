import {
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
import { ArdoLink } from "../runtime/page"
import { useArdoPath } from "../runtime/page-context"

import { useArdoConfig, useArdoLabels } from "../runtime/hooks"
import { ChromeIcon } from "./chrome-icons"
import { joinClassNames } from "./classnames"
import { ArdoHeaderSearch } from "./components/HeaderSearch"
import { ArdoThemeToggle } from "./components/ThemeToggle"
import { type ArdoHeaderSearchMode, resolveHeaderSearch } from "./header-search-mode"
import * as styles from "./Header.css"
import { type ArdoLogo, HeaderLogo } from "./HeaderLogo"
import { GithubIcon, LinkedinIcon, NpmIcon, TwitterIcon, YoutubeIcon } from "./brand-icons"
import { MessageCircle } from "./content-icons"
import { useArdoLayoutVariant } from "./layout-context"
import { MobileSlidePanel } from "./MobileSlidePanel"
import * as navStyles from "./Nav.css"
import { ArdoLocaleSwitcher } from "./site-controls"
import { useHasLocaleSwitcher, useHasVersionSwitcher } from "./site-controls-state"

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
  /**
   * Search presentation (default: `"auto"`). `false` hides search; `true`
   * is the same as `"auto"`.
   */
  search?: ArdoHeaderSearchMode | boolean
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

/** The right side of the header, for links such as `ArdoSocialLink`. */
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
  const [open, setOpen] = useState(false)
  const pathname = useArdoPath()
  const [previousPathname, setPreviousPathname] = useState(pathname)

  if (pathname !== previousPathname) {
    setPreviousPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return [open, setOpen]
}

/**
 * On narrow screens the header keeps only the menu, the logo and search, so
 * the menu also carries the version, language, appearance and links.
 */
function useHasMobileMenu(content: ReactNode[], themeToggle: boolean): boolean {
  const hasVersions = useHasVersionSwitcher()
  const hasLocales = useHasLocaleSwitcher()
  return content.some((node) => node != null) || themeToggle || hasVersions || hasLocales
}

/**
 * The site header: logo, title, navigation, search, theme toggle, and the menu on narrow
 * screens.
 */
export function ArdoHeader({
  logo,
  title,
  children,
  search = "auto",
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
  const layout = useArdoLayoutVariant()
  const searchMode = resolveHeaderSearch(search, layout)

  const resolvedLogo = logo
  const resolvedTitle = title ?? config.title
  const hasLogo = resolvedLogo !== undefined
  const hasTitle = resolvedTitle !== ""
  const hasMobileMenu = useHasMobileMenu([mobileMenuContent, nav, actions], themeToggle)
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [setMobileMenuOpen])

  return (
    <>
      <header className={joinClassNames("ardo-header", className ?? styles.header)}>
        <div
          className={joinClassNames(
            styles.headerContainer,
            layout === "bare" ? styles.headerContainerPage : undefined,
            searchMode === "field" ? undefined : styles.headerContainerSplit
          )}
        >
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
                <ChromeIcon name="menu" />
              </button>
            )}
            <ArdoLink to="/" className={styles.logoLink}>
              {hasLogo && <HeaderLogo logo={resolvedLogo} alt={resolvedTitle} />}
              {hasTitle && <span className={styles.siteTitle}>{resolvedTitle}</span>}
            </ArdoLink>
          </div>

          {searchMode === "field" && (
            <div className={styles.headerCenter}>
              <ArdoHeaderSearch placeholder={searchPlaceholder} onActivate={closeMobileMenu} />
            </div>
          )}

          <div className={styles.headerRight}>
            {nav != null && <div className={styles.desktopNav}>{nav}</div>}
            {searchMode === "icon" && (
              <ArdoHeaderSearch
                placeholder={searchPlaceholder}
                variant="icon"
                onActivate={closeMobileMenu}
              />
            )}
            <div className={styles.desktopActions}>
              <ArdoLocaleSwitcher />
              {themeToggle && <ArdoThemeToggle />}
              {actions}
            </div>
          </div>
        </div>
      </header>

      {hasMobileMenu && mobileMenuOpen && (
        <MobileSlidePanel
          logo={resolvedLogo}
          title={resolvedTitle}
          nav={nav}
          actions={actions}
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

/** An icon link to a profile or repository, such as GitHub, npm, or Discord. */
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
  discord: MessageCircle,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
  npm: NpmIcon,
} as const

function SocialIcon({ icon }: { icon: keyof typeof socialIcons }) {
  const IconComponent = socialIcons[icon]
  return <IconComponent size={20} />
}
