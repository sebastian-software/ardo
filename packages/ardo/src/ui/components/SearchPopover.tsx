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
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 400),
    })
  }, [anchorRef])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className={styles.searchPopover}
      style={{
        top: pos.top,
        left: pos.left,
        width: Math.min(pos.width, globalThis.innerWidth - 32),
      }}
    >
      {children}
    </div>,
    document.body
  )
}
