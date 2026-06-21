import { useEffect, useState } from "react"
import { useLocation } from "react-router"

import { SearchIcon, XIcon } from "../icons"
import * as styles from "./HeaderSearch.css"
import { ArdoSearch, type ArdoSearchProps } from "./Search"

/**
 * Header-hosted search. On desktop it renders the search input inline; on
 * narrow viewports it collapses to an icon button that opens a full-width
 * search overlay.
 */
export function ArdoHeaderSearch({ placeholder }: ArdoSearchProps) {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const location = useLocation()

  // Close the overlay on navigation and on Escape.
  useEffect(() => {
    setOverlayOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!overlayOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOverlayOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("keydown", handleKey)
    }
  }, [overlayOpen])

  return (
    <>
      <div className={styles.inline}>
        <ArdoSearch placeholder={placeholder} />
      </div>

      <button
        type="button"
        className={styles.trigger}
        aria-label="Search"
        onClick={() => {
          setOverlayOpen(true)
        }}
      >
        <SearchIcon size={20} />
      </button>

      {overlayOpen && (
        <div className={styles.overlay}>
          <div className={styles.overlayBar}>
            <div className={styles.overlaySearch}>
              <ArdoSearch placeholder={placeholder} autoFocus />
            </div>
            <button
              type="button"
              className={styles.overlayClose}
              aria-label="Close search"
              onClick={() => {
                setOverlayOpen(false)
              }}
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
