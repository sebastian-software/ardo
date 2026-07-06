import { type MouseEvent, type ReactNode, type RefObject, useEffect, useRef } from "react"
import { Link } from "react-router"

import { useArdoLabels } from "../runtime/hooks"
import { joinClassNames } from "./classnames"
import { ArdoThemeToggle } from "./components/ThemeToggle"
import * as styles from "./Header.css"
import { type ArdoLogo, HeaderLogo } from "./HeaderLogo"
import { XIcon } from "./icons"
import { focusInitialElement, trapFocus } from "./mobile-drawer-a11y"

export function MobileSlidePanel({
  logo,
  title,
  nav,
  themeToggle,
  triggerRef,
  children,
  onClose,
}: {
  logo?: ArdoLogo
  title: string
  nav?: ReactNode
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
          <Link to="/" className={styles.logoLink} onClick={onClose}>
            {logo != null && <HeaderLogo logo={logo} alt={title} />}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {themeToggle && <ArdoThemeToggle />}
            <button
              type="button"
              className={styles.mobilePanelClose}
              onClick={onClose}
              aria-label={labels.mobilePanel.closeMenu}
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {nav != null && (
          <div className={styles.mobilePanelNav} onClickCapture={handleLinkClick(onClose)}>
            {nav}
          </div>
        )}

        <div className={styles.mobilePanelSidebar} onClickCapture={handleLinkClick(onClose)}>
          {children}
        </div>
      </div>
    </>
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
