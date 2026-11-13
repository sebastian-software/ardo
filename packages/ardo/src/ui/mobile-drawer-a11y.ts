export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",")

export type FocusableElementCandidate = {
  closest: (selectors: string) => unknown
  getAttribute: (qualifiedName: string) => null | string
  hasAttribute: (qualifiedName: string) => boolean
}

export function getTrappedFocusTarget<T>({
  activeElement,
  focusableElements,
  focusInside = true,
  shiftKey,
}: {
  activeElement: null | T
  focusableElements: T[]
  /** False when focus rests on the container itself or outside it. */
  focusInside?: boolean
  shiftKey: boolean
}): T | undefined {
  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)

  if (firstElement == null || lastElement == null) {
    return
  }

  if (!focusInside) {
    return shiftKey ? lastElement : firstElement
  }

  if (shiftKey && activeElement === firstElement) {
    return lastElement
  }

  if (!shiftKey && activeElement === lastElement) {
    return firstElement
  }
}

export function isFocusableElement(element: FocusableElementCandidate): boolean {
  return (
    !element.hasAttribute("disabled") &&
    element.getAttribute("aria-hidden") !== "true" &&
    element.closest("[inert]") == null
  )
}

export function getFocusableElements(container: ParentNode): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter((element) =>
    isFocusableElement(element)
  )
}

export function focusInitialElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container)
  const initialFocusTarget = focusableElements[0] ?? container
  initialFocusTarget.focus()
}

export function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
  const focusableElements = getFocusableElements(container)
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  const target = getTrappedFocusTarget({
    activeElement,
    focusableElements,
    // Clicking empty space focuses the tabIndex=-1 container; Shift+Tab would leave from there.
    focusInside:
      activeElement != null && activeElement !== container && container.contains(activeElement),
    shiftKey: event.shiftKey,
  })

  if (target == null) {
    return
  }

  event.preventDefault()
  target.focus()
}
