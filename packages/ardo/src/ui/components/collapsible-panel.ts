import { useLayoutEffect, useRef, useState } from "react"

import { useHiddenUntilFound } from "./disclosure"

const PANEL_HEIGHT_PROPERTY = "--accordion-panel-height"

/** Resolve once every CSS transition or animation running on the element settles. */
function animationsSettled(element: HTMLElement): Promise<unknown> {
  // getAnimations() flushes pending style changes, so transitions triggered by
  // the attribute change just before are already included.
  if (typeof element.getAnimations !== "function") return Promise.resolve()
  return Promise.allSettled(element.getAnimations().map((animation) => animation.finished))
}

/** Full panel height including borders, measurable even while the panel is clipped. */
function expandedHeight(panel: HTMLElement): string {
  return `${panel.scrollHeight + panel.offsetHeight - panel.clientHeight}px`
}

function afterTransitions(panel: HTMLElement, isCurrent: () => boolean, callback: () => void) {
  void animationsSettled(panel).then(() => {
    if (isCurrent()) callback()
  })
}

function openPanel(panel: HTMLElement, isCurrent: () => boolean) {
  if (panel.dataset.endingStyle == null) {
    panel.dataset.startingStyle = ""
  } else {
    // Reopened mid-close: continue from the current height.
    panel.style.setProperty(PANEL_HEIGHT_PROPERTY, `${panel.offsetHeight}px`)
    delete panel.dataset.endingStyle
  }
  void panel.offsetHeight
  panel.style.setProperty(PANEL_HEIGHT_PROPERTY, expandedHeight(panel))
  delete panel.dataset.startingStyle
  // Back to auto height so content changes (nested accordions) reflow freely.
  afterTransitions(panel, isCurrent, () => panel.style.removeProperty(PANEL_HEIGHT_PROPERTY))
}

function clearTransitionStyles(panel: HTMLElement) {
  delete panel.dataset.startingStyle
  delete panel.dataset.endingStyle
  panel.style.removeProperty(PANEL_HEIGHT_PROPERTY)
}

function closePanel(panel: HTMLElement, isCurrent: () => boolean, onClosed: () => void) {
  // Transitions cannot start from `auto`: pin the current height first.
  panel.style.setProperty(PANEL_HEIGHT_PROPERTY, `${panel.offsetHeight}px`)
  delete panel.dataset.startingStyle
  void panel.offsetHeight
  panel.dataset.endingStyle = ""
  afterTransitions(panel, isCurrent, () => {
    // Hide before dropping the pinned height, or the panel flashes at full
    // height for a frame until React commits `hidden`.
    panel.setAttribute("hidden", "until-found")
    clearTransitionStyles(panel)
    onClosed()
  })
}

/**
 * Collapse state of one accordion panel: keeps it rendered while its close
 * transition runs, drives the height transition through
 * `--accordion-panel-height` and `data-starting-style` / `data-ending-style`,
 * and turns the closed panel into `hidden="until-found"` so find-in-page can
 * still reveal it.
 */
export function useCollapsiblePanel(open: boolean, onReveal: () => void) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(open)
  // Compared instead of a mounted flag, which StrictMode's repeated mount effect defeats.
  const previousOpenRef = useRef(open)
  const runRef = useRef(0)
  const skipOpenTransitionRef = useRef(false)

  if (open && !visible) setVisible(true)

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (panel == null || previousOpenRef.current === open) return
    previousOpenRef.current = open

    const run = ++runRef.current
    const isCurrent = () => runRef.current === run
    if (!open) {
      closePanel(panel, isCurrent, () => setVisible(false))
    } else if (skipOpenTransitionRef.current) {
      skipOpenTransitionRef.current = false
      clearTransitionStyles(panel)
    } else {
      openPanel(panel, isCurrent)
    }
  }, [open])

  useHiddenUntilFound(panelRef, !visible, () => {
    // A find-in-page match is already visible: reveal without motion.
    skipOpenTransitionRef.current = true
    onReveal()
  })

  return { panelRef, hidden: !visible }
}
