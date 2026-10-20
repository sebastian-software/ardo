type VerticalBox = Pick<DOMRect, "top" | "bottom" | "height">

/**
 * Returns the nav scroll position that shows the active link in the upper third,
 * or `undefined` when the link is already fully visible.
 */
export function getSidebarScrollTop(
  nav: VerticalBox,
  link: VerticalBox,
  scrollTop: number
): number | undefined {
  if (link.top >= nav.top && link.bottom <= nav.bottom) return undefined
  return Math.max(0, scrollTop + link.top - nav.top - nav.height / 3)
}
