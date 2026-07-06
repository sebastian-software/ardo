import { type MouseEvent, type ReactNode, type RefObject, useEffect, useRef } from "react"
import { Link } from "react-router"

import { joinClassNames } from "./classnames"
import { ArdoThemeToggle } from "./components/ThemeToggle"
import * as styles from "./Header.css"
import { XIcon } from "./icons"
import { getTrappedFocusTarget } from "./mobile-drawer-a11y"

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",")

export function MobileSlidePanel({
  logo,
  title,
  nav,
  themeToggle,
  triggerRef,
  children,
  onClose,
}: {
  logo?: { light: string; dark: string } | string
  title: string
  nav?: ReactNode
  themeToggle?: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
  children: ReactNode
  onClose: () => void
}) {
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
        aria-label={title === "" ? "Navigation menu" : `${title} navigation menu`}
        tabIndex={-1}
      >
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

    focusInitialPanelElement(panel)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === "Tab") {
        trapPanelFocus(event, panel)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      triggerElement?.focus()
    }
  }, [onClose, panelRef, triggerRef])
}

function focusInitialPanelElement(panel: HTMLDivElement) {
  const focusableElements = getFocusablePanelElements(panel)
  const initialFocusTarget = focusableElements[0] ?? panel
  initialFocusTarget.focus()
}

function trapPanelFocus(event: KeyboardEvent, panel: HTMLDivElement) {
  const focusableElements = getFocusablePanelElements(panel)
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  const target = getTrappedFocusTarget({
    activeElement,
    focusableElements,
    shiftKey: event.shiftKey,
  })

  if (target == null) {
    return
  }

  event.preventDefault()
  target.focus()
}

function getFocusablePanelElements(panel: HTMLDivElement) {
  return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
  )
}

function handleLinkClick(onClose: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("a") !== null) {
      onClose()
    }
  }
}
