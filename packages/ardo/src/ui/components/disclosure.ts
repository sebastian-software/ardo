import type { KeyboardEvent, RefObject } from "react"

import { useEffect, useLayoutEffect, useRef } from "react"

/**
 * Keeps a collapsed panel searchable by the browser's find-in-page.
 *
 * React renders `hidden` only as a boolean, which prerenders as `hidden=""`.
 * After hydration the panel switches to `hidden="until-found"`, and a
 * `beforematch` event calls `onReveal` so the owner can show the match.
 */
export function useHiddenUntilFound(
  panelRef: RefObject<HTMLElement | null>,
  hidden: boolean,
  onReveal: () => void
) {
  useLayoutEffect(() => {
    if (hidden) panelRef.current?.setAttribute("hidden", "until-found")
  }, [hidden, panelRef])

  const revealRef = useRef(onReveal)
  useLayoutEffect(() => {
    revealRef.current = onReveal
  })

  useEffect(() => {
    const panel = panelRef.current
    if (panel == null) return
    const handleBeforeMatch = () => {
      revealRef.current()
    }
    panel.addEventListener("beforematch", handleBeforeMatch)
    return () => panel.removeEventListener("beforematch", handleBeforeMatch)
  }, [panelRef])
}

/**
 * Arrow-key navigation of a WAI-ARIA tablist with automatic activation:
 * ArrowLeft/ArrowRight move with wrap-around, Home/End jump to the first/last
 * tab, and the focused tab is selected.
 */
export function handleTabListKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (!isTabNavigationKey(event.key)) return
  if (!(event.target instanceof HTMLButtonElement)) return

  const tabList = event.currentTarget
  const tabs = [...tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')].filter(
    (tab) => tab.closest('[role="tablist"]') === tabList
  )
  const currentIndex = tabs.indexOf(event.target)
  if (currentIndex === -1) return

  event.preventDefault()
  const nextTab = tabs[getNextTabIndex(event.key, currentIndex, tabs.length)]
  nextTab.focus()
  nextTab.click()
}

function isTabNavigationKey(key: string) {
  return key === "ArrowLeft" || key === "ArrowRight" || key === "Home" || key === "End"
}

function getNextTabIndex(key: string, currentIndex: number, tabCount: number) {
  switch (key) {
    case "ArrowLeft":
      return (currentIndex - 1 + tabCount) % tabCount
    case "ArrowRight":
      return (currentIndex + 1) % tabCount
    case "Home":
      return 0
    case "End":
      return tabCount - 1
    default:
      return currentIndex
  }
}
