import { useLayoutEffect, useState } from "react"
import { createPortal } from "react-dom"

import * as styles from "./Search.css"

/**
 * Renders the search popover as a portal attached to document.body.
 * Uses getBoundingClientRect to position it below the anchor element.
 */
export function SearchPopover({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

  useLayoutEffect(() => {
    const updatePosition = () => {
      const el = anchorRef.current
      if (el == null) {
        return
      }

      const rect = el.getBoundingClientRect()
      const viewportWidth = globalThis.innerWidth
      const maxWidth = Math.max(viewportWidth - 32, 0)
      const width = Math.min(Math.max(rect.width, 400), maxWidth)
      const maxLeft = Math.max(viewportWidth - width - 16, 0)
      setPos({
        top: rect.bottom + 8,
        left: Math.min(Math.max(rect.left, 16), maxLeft),
        width,
      })
    }

    updatePosition()
    globalThis.addEventListener("resize", updatePosition)
    globalThis.addEventListener("scroll", updatePosition, true)
    return () => {
      globalThis.removeEventListener("resize", updatePosition)
      globalThis.removeEventListener("scroll", updatePosition, true)
    }
  }, [anchorRef])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className={styles.searchPopover}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
      }}
    >
      {children}
    </div>,
    document.body
  )
}
