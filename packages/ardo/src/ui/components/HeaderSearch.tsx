import { useCallback, useEffect, useRef, useState } from "react"
import { useArdoPath } from "../../runtime/page-context"

import { useArdoLabels } from "../../runtime/hooks"
import { ChromeIcon } from "../chrome-icons"
import { joinClassNames } from "../classnames"
import { focusInitialElement, trapFocus } from "../mobile-drawer-a11y"
import * as styles from "./HeaderSearch.css"
import { ArdoSearch } from "./Search"
import { getSearchShortcutModifier, isSearchShortcut } from "./search-a11y"
import { getSearchRecoveryQuery } from "./search-recovery"

export type ArdoHeaderSearchProps = {
  /** Placeholder text for the search input */
  placeholder?: string
  /**
   * `"field"` shows the input on desktop and an icon button on narrow
   * viewports. `"icon"` shows only the icon button, at every width.
   */
  variant?: "field" | "icon"
  /** Close related header UI before activating search. */
  onActivate?: () => void
  /** Additional classes on the search trigger button. */
  className?: string
}

/**
 * Header-hosted search. The field variant renders the input inline on
 * desktop; both variants open a search overlay from an icon button.
 * ⌘K / Ctrl+K focuses the inline input when it is visible and opens the
 * overlay otherwise.
 */
export function ArdoHeaderSearch({
  placeholder,
  variant = "field",
  onActivate,
  className,
}: ArdoHeaderSearchProps) {
  const labels = useArdoLabels()
  const { closeOverlay, openOverlay, overlayOpen } = useSearchOverlayState()
  const inlineRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isIcon = variant === "icon"

  useSearchOverlayFocus({
    onClose: closeOverlay,
    open: overlayOpen,
    inlineRef,
    overlayRef,
    triggerRef,
  })
  useHeaderSearchShortcut({ inlineRef, overlayRef, onActivate, onOpenOverlay: openOverlay })

  return (
    <>
      {!isIcon && (
        <div ref={inlineRef} className={styles.inline}>
          <ArdoSearch placeholder={placeholder} shortcut={false} />
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={joinClassNames(isIcon ? styles.triggerIcon : styles.trigger, className)}
        aria-label={labels.search.label}
        aria-expanded={overlayOpen}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => {
          onActivate?.()
          openOverlay()
        }}
      >
        <ChromeIcon name="search" />
        <span className={styles.tooltip} aria-hidden="true">
          <kbd suppressHydrationWarning>{getSearchShortcutModifier()}</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      {overlayOpen && (
        <div
          ref={overlayRef}
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={labels.search.label}
          tabIndex={-1}
        >
          <div className={styles.overlayBar}>
            <div className={styles.overlaySearch}>
              <ArdoSearch placeholder={placeholder} autoFocus shortcut={false} />
            </div>
            <button
              type="button"
              className={styles.overlayClose}
              aria-label={labels.search.closeOverlay}
              onClick={closeOverlay}
            >
              <ChromeIcon name="close" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/** Overlay open state; closes on navigation. */
function useSearchOverlayState() {
  const pathname = useArdoPath()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [previousPathname, setPreviousPathname] = useState(pathname)
  const openOverlay = useCallback(() => {
    setOverlayOpen(true)
  }, [])
  const closeOverlay = useCallback(() => {
    setOverlayOpen(false)
  }, [])

  useEffect(() => {
    if (getSearchRecoveryQuery() != null) openOverlay()
  }, [openOverlay])

  if (pathname !== previousPathname) {
    setPreviousPathname(pathname)
    setOverlayOpen(false)
  }

  return { closeOverlay, openOverlay, overlayOpen }
}

/**
 * One ⌘K / Ctrl+K handler per header. An open overlay keeps ownership of
 * search across responsive changes; otherwise use the visible inline field
 * or open the overlay after closing related header UI.
 */
function useHeaderSearchShortcut({
  inlineRef,
  overlayRef,
  onActivate,
  onOpenOverlay,
}: {
  inlineRef: React.RefObject<HTMLDivElement | null>
  overlayRef: React.RefObject<HTMLDivElement | null>
  onActivate?: () => void
  onOpenOverlay: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event)) return
      event.preventDefault()
      if (focusSearchField(overlayRef.current)) return
      onActivate?.()
      if (focusSearchField(inlineRef.current)) return
      onOpenOverlay()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [inlineRef, overlayRef, onActivate, onOpenOverlay])
}

function useSearchOverlayFocus({
  onClose,
  open,
  inlineRef,
  overlayRef,
  triggerRef,
}: {
  onClose: () => void
  open: boolean
  inlineRef: React.RefObject<HTMLDivElement | null>
  overlayRef: React.RefObject<HTMLDivElement | null>
  triggerRef: React.RefObject<HTMLButtonElement | null>
}) {
  useEffect(() => {
    if (!open) {
      return
    }

    const overlay = overlayRef.current
    const inlineElement = inlineRef.current
    const triggerElement = triggerRef.current
    document.body.style.overflow = "hidden"

    if (overlay != null) {
      focusInitialElement(overlay)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === "Tab" && overlay != null) {
        trapFocus(event, overlay)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", handleKeyDown)
      if (!focusSearchField(inlineElement)) triggerElement?.focus()
    }
  }, [onClose, open, inlineRef, overlayRef, triggerRef])
}

/** The inline field hides at the mobile breakpoint; the overlay is absent when closed. */
function focusSearchField(container: HTMLDivElement | null): boolean {
  const input = container?.querySelector("input")
  if (container == null || input == null || getComputedStyle(container).display === "none") {
    return false
  }
  input.focus()
  return true
}
