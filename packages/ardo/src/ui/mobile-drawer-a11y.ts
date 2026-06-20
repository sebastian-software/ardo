export function getTrappedFocusTarget<T>({
  activeElement,
  focusableElements,
  shiftKey,
}: {
  activeElement: null | T
  focusableElements: T[]
  shiftKey: boolean
}): T | undefined {
  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)

  if (firstElement == null || lastElement == null) {
    return
  }

  if (shiftKey && activeElement === firstElement) {
    return lastElement
  }

  if (!shiftKey && activeElement === lastElement) {
    return firstElement
  }
}
