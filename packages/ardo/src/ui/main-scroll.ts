// The viewport shell scrolls `#main-content`, not the document. While focus rests on <body>,
// browsers send scroll keys to the document, and a reload restores only the document's position.
// These helpers carry both over to the shell's scroller.

const ARROW_STEP = 40
// Browsers keep a little of the previous page in view when paging.
const PAGE_FRACTION = 0.875

export const MAIN_SCROLL_STORAGE_PREFIX = "ardo-scroll:"

function isScrollable(element: Element): boolean {
  const { overflowY } = getComputedStyle(element)
  return (
    (overflowY === "auto" || overflowY === "scroll") && element.scrollHeight > element.clientHeight
  )
}

function isRestingFocus(element: Element | null): boolean {
  return element == null || element === document.body || element === document.documentElement
}

/** Whether a click on this node chose a scroller other than main for the keyboard. */
function isInOtherScroller(node: Node | null, main: HTMLElement): boolean {
  let element = node instanceof Element ? node : (node?.parentElement ?? null)
  while (element != null && element !== document.body) {
    if (element === main) return false
    if (isScrollable(element)) return true
    element = element.parentElement
  }
  return false
}

function getScrollDelta(event: KeyboardEvent, main: HTMLElement): number | undefined {
  if (event.altKey || event.ctrlKey || event.metaKey) return undefined
  const page = main.clientHeight * PAGE_FRACTION
  if (event.key === " ") return event.shiftKey ? -page : page
  if (event.shiftKey) return undefined
  switch (event.key) {
    case "ArrowDown":
      return ARROW_STEP
    case "ArrowUp":
      return -ARROW_STEP
    case "PageDown":
      return page
    case "PageUp":
      return -page
    case "End":
      return main.scrollHeight
    case "Home":
      return -main.scrollHeight
    default:
      return undefined
  }
}

function getScrollBehavior(event: KeyboardEvent): ScrollBehavior {
  const reduced =
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  // Held keys repeat faster than a smooth scroll settles.
  return reduced || event.repeat ? "instant" : "smooth"
}

/**
 * Scroll main with the keyboard while focus rests on the page itself. Focus stays where it is, so
 * the first Tab still reaches the skip link and screen readers start at the top of the page.
 */
export function forwardMainScrollKeys(main: HTMLElement): () => void {
  let pointerTarget: EventTarget | null = null
  const onPointerDown = (event: PointerEvent) => {
    pointerTarget = event.target
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing) return
    if (!isRestingFocus(document.activeElement)) return
    if (event.target instanceof Element && !isRestingFocus(event.target)) return
    if (pointerTarget instanceof Node && isInOtherScroller(pointerTarget, main)) return
    const delta = getScrollDelta(event, main)
    if (delta === undefined || !isScrollable(main)) return
    event.preventDefault()
    main.scrollBy({ top: delta, behavior: getScrollBehavior(event) })
  }
  document.addEventListener("pointerdown", onPointerDown, true)
  document.addEventListener("keydown", onKeyDown)
  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true)
    document.removeEventListener("keydown", onKeyDown)
  }
}

/**
 * Inline script placed right after the app markup. It saves main's position when the page is left
 * and restores it on reload or history navigation before the first paint, unless a fragment names
 * the target. Pages served from the back/forward cache keep their position without it.
 */
export const MAIN_SCROLL_RESTORATION_SCRIPT = `(() => {
  try {
    const main = document.getElementById("main-content");
    if (main == null) return;
    const key = ${JSON.stringify(MAIN_SCROLL_STORAGE_PREFIX)} + location.pathname + location.search;
    const scrolls = () => {
      const overflow = getComputedStyle(main).overflowY;
      return overflow === "auto" || overflow === "scroll";
    };
    addEventListener("pagehide", () => {
      try {
        const top = Math.round(main.scrollTop);
        if (top > 0 && scrolls()) sessionStorage.setItem(key, String(top));
        else sessionStorage.removeItem(key);
      } catch {
      }
    });
    const entry = performance.getEntriesByType("navigation")[0];
    const type = entry == null ? "" : entry.type;
    if (location.hash !== "" || (type !== "reload" && type !== "back_forward") || !scrolls()) return;
    const top = Number(sessionStorage.getItem(key));
    if (top > 0) main.scrollTop = top;
  } catch {
  }
})();`
