import { useLayoutEffect, useState } from "react"
import { createPortal } from "react-dom"

import * as styles from "./Search.css"
import { getSearchPopoverPosition } from "./search-popover-position"

/**
 * Keep modal results inside their dialog and fit them below the search field,
 * including when a software keyboard reduces the visual viewport.
 */
export function SearchPopover({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 0 })
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const viewport = globalThis.visualViewport
    const updatePosition = () => {
      const el = anchorRef.current
      if (el == null) {
        return
      }

      setPos(
        getSearchPopoverPosition(el.getBoundingClientRect(), {
          width: viewport?.width ?? globalThis.innerWidth,
          height: viewport?.height ?? globalThis.innerHeight,
          left: viewport?.offsetLeft ?? 0,
          top: viewport?.offsetTop ?? 0,
        })
      )
      setPortalTarget(el.closest<HTMLElement>('[role="dialog"]') ?? document.body)
    }

    updatePosition()
    globalThis.addEventListener("resize", updatePosition)
    globalThis.addEventListener("scroll", updatePosition, true)
    viewport?.addEventListener("resize", updatePosition)
    viewport?.addEventListener("scroll", updatePosition)
    return () => {
      globalThis.removeEventListener("resize", updatePosition)
      globalThis.removeEventListener("scroll", updatePosition, true)
      viewport?.removeEventListener("resize", updatePosition)
      viewport?.removeEventListener("scroll", updatePosition)
    }
  }, [anchorRef])

  if (portalTarget == null) return null

  return createPortal(
    <div
      className={styles.searchPopover}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
      }}
    >
      {children}
    </div>,
    portalTarget
  )
}
