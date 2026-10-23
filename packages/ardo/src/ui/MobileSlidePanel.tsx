import { type MouseEvent, type ReactNode, type RefObject, useEffect, useRef } from "react"
import { ArdoLink } from "../runtime/page"

import { useArdoLabels } from "../runtime/hooks"
import { ChromeIcon } from "./chrome-icons"
import { joinClassNames } from "./classnames"
import { ArdoThemeToggle } from "./components/ThemeToggle"
import * as styles from "./Header.css"
import { type ArdoLogo, HeaderLogo } from "./HeaderLogo"
import { focusInitialElement, trapFocus } from "./mobile-drawer-a11y"
import { ArdoLocaleSwitcher, ArdoVersionSwitcher } from "./site-controls"
import {
  ArdoMobilePanelContext,
  useHasLocaleSwitcher,
  useHasVersionSwitcher,
} from "./site-controls-state"
import * as controlStyles from "./site-controls.css"

export function MobileSlidePanel({
  id,
  logo,
  title,
  nav,
  actions,
  themeToggle = false,
  triggerRef,
  children,
  onClose,
}: {
  id?: string
  logo?: ArdoLogo
  title: string
  nav?: ReactNode
  /** Header actions such as social links, shown in the closing section. */
  actions?: ReactNode
  themeToggle?: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
  children: ReactNode
  onClose: () => void
}) {
  const labels = useArdoLabels()
  const panelRef = useRef<HTMLDivElement>(null)

  useMobilePanelFocus({ onClose, panelRef, triggerRef })

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div className={styles.mobileBackdrop} data-open="true" onClick={onClose} />

      <div
        id={id}
        ref={panelRef}
        className={joinClassNames("ardo-mobile-panel", styles.mobilePanel)}
        data-open="true"
        role="dialog"
        aria-modal="true"
        aria-label={
          title === ""
            ? labels.mobilePanel.navigationMenu
            : labels.mobilePanel.titledNavigationMenu(title)
        }
        tabIndex={-1}
      >
        <div className={styles.mobilePanelHeader}>
          <ArdoLink
            to="/"
            className={styles.logoLink}
            onClick={onClose}
            aria-label={title || labels.mobilePanel.home}
          >
            {logo != null ? (
              <HeaderLogo logo={logo} alt={title} />
            ) : (
              <span className={styles.siteTitle}>{title || labels.mobilePanel.home}</span>
            )}
          </ArdoLink>
          <button
            type="button"
            className={styles.mobilePanelClose}
            onClick={onClose}
            aria-label={labels.mobilePanel.closeMenu}
          >
            <ChromeIcon name="close" />
          </button>
        </div>

        {nav != null && (
          <div className={styles.mobilePanelNav} onClickCapture={handleLinkClick(onClose)}>
            {nav}
          </div>
        )}

        <div className={styles.mobilePanelSidebar} onClickCapture={handleLinkClick(onClose)}>
          <ArdoMobilePanelContext value>{children}</ArdoMobilePanelContext>
        </div>

        <PanelSettings actions={actions} themeToggle={themeToggle} />
      </div>
    </>
  )
}

/** Version, language, appearance and links, which the narrow header leaves out. */
function PanelSettings({ actions, themeToggle }: { actions?: ReactNode; themeToggle: boolean }) {
  const labels = useArdoLabels()
  const hasVersions = useHasVersionSwitcher()
  const hasLocales = useHasLocaleSwitcher()
  if (!hasVersions && !hasLocales && !themeToggle && actions == null) return null
  return (
    <div className={joinClassNames("ardo-mobile-panel-settings", controlStyles.panelSettings)}>
      {hasVersions && (
        <div className={controlStyles.panelSettingsRow}>
          <span>{labels.siteControls.version}</span>
          <ArdoVersionSwitcher />
        </div>
      )}
      {hasLocales && (
        <div className={controlStyles.panelSettingsRow}>
          <span>{labels.siteControls.language}</span>
          <ArdoLocaleSwitcher />
        </div>
      )}
      {themeToggle && (
        <div className={controlStyles.panelSettingsRow}>
          <span>{labels.siteControls.appearance}</span>
          <ArdoThemeToggle />
        </div>
      )}
      {actions != null && (
        <div className={controlStyles.panelSettingsRow}>
          <span>{labels.siteControls.links}</span>
          <span className={controlStyles.panelSettingsLinks}>{actions}</span>
        </div>
      )}
    </div>
  )
}

function useMobilePanelFocus({
  onClose,
  panelRef,
  triggerRef,
}: {
  onClose: () => void
  panelRef: RefObject<HTMLDivElement | null>
  triggerRef: RefObject<HTMLButtonElement | null>
}) {
  useEffect(() => {
    const panel = panelRef.current
    if (panel == null) {
      return
    }
    const triggerElement = triggerRef.current

    focusInitialElement(panel)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === "Tab") {
        trapFocus(event, panel)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      triggerElement?.focus()
    }
  }, [onClose, panelRef, triggerRef])
}

function handleLinkClick(onClose: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("a") !== null) {
      onClose()
    }
  }
}
