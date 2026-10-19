import { useCallback, useEffect, useRef, useState } from "react"
import { useArdoPath } from "../../runtime/page-context"

import { useArdoLabels } from "../../runtime/hooks"
import { ChromeIcon } from "../chrome-icons"
import { focusInitialElement, trapFocus } from "../mobile-drawer-a11y"
import * as styles from "./HeaderSearch.css"
import { ArdoSearch } from "./Search"
import { getSearchShortcutModifier, isSearchShortcut } from "./search-a11y"

export type ArdoHeaderSearchProps = {
  /** Placeholder text for the search input */
  placeholder?: string
  /**
   * `"field"` shows the input on desktop and an icon button on narrow
   * viewports. `"icon"` shows only the icon button, at every width.
   */
  variant?: "field" | "icon"
}

/**
 * Header-hosted search. The field variant renders the input inline on
 * desktop; both variants open a search overlay from an icon button.
 * ⌘K / Ctrl+K focuses the inline input when it is visible and opens the
 * overlay otherwise.
 */
export function ArdoHeaderSearch({ placeholder, variant = "field" }: ArdoHeaderSearchProps) {
  const labels = useArdoLabels()
  const { closeOverlay, openOverlay, overlayOpen } = useSearchOverlayState()
  const inlineRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isIcon = variant === "icon"

  useSearchOverlayFocus({
    onClose: closeOverlay,
    open: overlayOpen,
    overlayRef,
    triggerRef,
  })
  useHeaderSearchShortcut({ inlineRef, onOpenOverlay: openOverlay })

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
        className={isIcon ? styles.triggerIcon : styles.trigger}
        aria-label={labels.search.label}
        aria-expanded={overlayOpen}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={openOverlay}
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
          aria-label="Search"
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

  if (pathname !== previousPathname) {
    setPreviousPathname(pathname)
    setOverlayOpen(false)
  }

  return { closeOverlay, openOverlay, overlayOpen }
}

/**
 * One ⌘K / Ctrl+K handler per header: focus the inline input while it is
 * shown, otherwise open the overlay. The inline input hides via CSS on
 * narrow viewports, so the check runs on each key press.
 */
function useHeaderSearchShortcut({
  inlineRef,
  onOpenOverlay,
}: {
  inlineRef: React.RefObject<HTMLDivElement | null>
  onOpenOverlay: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event)) return
      event.preventDefault()
      const inline = inlineRef.current
      const input = inline?.querySelector("input")
      if (inline != null && input != null && getComputedStyle(inline).display !== "none") {
        input.focus()
        return
      }
      onOpenOverlay()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [inlineRef, onOpenOverlay])
}

function useSearchOverlayFocus({
  onClose,
  open,
  overlayRef,
  triggerRef,
}: {
  onClose: () => void
  open: boolean
  overlayRef: React.RefObject<HTMLDivElement | null>
  triggerRef: React.RefObject<HTMLButtonElement | null>
}) {
  useEffect(() => {
    if (!open) {
      return
    }

    const overlay = overlayRef.current
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
      triggerElement?.focus()
    }
  }, [onClose, open, overlayRef, triggerRef])
}
