export function getSearchPopoverPosition(
  anchor: Pick<DOMRect, "bottom" | "left" | "width">,
  viewport: { width: number; height: number; left: number; top: number }
) {
  const width = Math.min(Math.max(anchor.width, 400), Math.max(viewport.width - 32, 0))
  const top = Math.max(anchor.bottom + 8, viewport.top + 8)
  return {
    top,
    left: Math.min(
      Math.max(anchor.left, viewport.left + 16),
      Math.max(viewport.left + viewport.width - width - 16, viewport.left)
    ),
    width,
    maxHeight: Math.max(viewport.top + viewport.height - top - 16, 0),
  }
}
