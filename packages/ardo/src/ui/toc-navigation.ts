export function getTocScrollBehavior(isReducedMotion: boolean): ScrollBehavior {
  return isReducedMotion ? "auto" : "smooth"
}

function hasReducedMotionPreference(): boolean {
  if (typeof globalThis.matchMedia !== "function") return false
  return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function resolveTocScrollRegion() {
  const main = document.getElementById("main-content")
  // A host can let the document scroll instead of Ardo's viewport shell.
  const overflow = main == null ? "" : getComputedStyle(main).overflowY
  const root = overflow === "auto" || overflow === "scroll" ? main : null
  const height = root?.clientHeight ?? 0
  return { root, height: height > 0 ? height : globalThis.innerHeight }
}

export function scrollToHeading(id: string) {
  const element = document.getElementById(id)
  const container = resolveTocScrollRegion().root ?? document
  if (element == null) return container

  focusHeading(element)
  element.scrollIntoView({
    behavior: getTocScrollBehavior(hasReducedMotionPreference()),
    block: "start",
  })
  globalThis.history.pushState(null, "", `#${id}`)
  return container
}

function focusHeading(element: HTMLElement) {
  const hadTabIndex = element.hasAttribute("tabindex")
  if (!hadTabIndex) {
    element.setAttribute("tabindex", "-1")
    element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true })
  }
  // Let the explicit scroll below own the motion; focusing must not jump first.
  element.focus({ preventScroll: true })
}
