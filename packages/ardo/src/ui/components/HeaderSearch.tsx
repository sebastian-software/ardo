import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation } from "react-router"

import { useArdoLabels } from "../../runtime/hooks"
import { SearchIcon, XIcon } from "../icons"
import { focusInitialElement, trapFocus } from "../mobile-drawer-a11y"
import * as styles from "./HeaderSearch.css"
import { ArdoSearch, type ArdoSearchProps } from "./Search"

/**
 * Header-hosted search. On desktop it renders the search input inline; on
 * narrow viewports it collapses to an icon button that opens a full-width
 * search overlay.
 */
export function ArdoHeaderSearch({ placeholder }: ArdoSearchProps) {
  const labels = useArdoLabels()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const location = useLocation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeOverlay = useCallback(() => {
    setOverlayOpen(false)
  }, [])

  // Close the overlay on navigation.
  useEffect(() => {
    setOverlayOpen(false)
  }, [location.pathname])

  useSearchOverlayFocus({
    onClose: closeOverlay,
    open: overlayOpen,
    overlayRef,
    triggerRef,
  })

  return (
    <>
      <div className={styles.inline}>
        <ArdoSearch placeholder={placeholder} />
      </div>

      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={labels.search.label}
        aria-expanded={overlayOpen}
        onClick={() => {
          setOverlayOpen(true)
        }}
      >
        <SearchIcon size={20} />
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
              <ArdoSearch placeholder={placeholder} autoFocus />
            </div>
            <button
              type="button"
              className={styles.overlayClose}
              aria-label={labels.search.closeOverlay}
              onClick={closeOverlay}
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  )
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
