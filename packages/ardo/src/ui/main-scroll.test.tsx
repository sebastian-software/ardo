// @vitest-environment jsdom

import { fireEvent, render } from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ArdoPageProvider } from "../runtime/page"
import { ArdoLayout, ArdoRootLayout } from "./Layout"
import { MAIN_SCROLL_RESTORATION_SCRIPT, MAIN_SCROLL_STORAGE_PREFIX } from "./main-scroll"

function makeScroller(main: HTMLElement, { clientHeight = 800, scrollHeight = 4000 } = {}) {
  main.style.overflowY = "auto"
  Object.defineProperty(main, "clientHeight", { configurable: true, value: clientHeight })
  Object.defineProperty(main, "scrollHeight", { configurable: true, value: scrollHeight })
  const scrollBy = vi.fn<(options?: ScrollToOptions) => void>()
  main.scrollBy = scrollBy as HTMLElement["scrollBy"]
  return scrollBy
}

function renderLayout(props: { bare?: boolean; scrollMode?: "document" | "viewport" } = {}) {
  render(
    <ArdoPageProvider>
      <ArdoLayout {...props} header={<input aria-label="Search" />}>
        <p>Content</p>
      </ArdoLayout>
    </ArdoPageProvider>
  )
  const main = document.getElementById("main-content")
  if (main == null) throw new Error("main is missing")
  return { main, scrollBy: makeScroller(main) }
}

describe("keyboard scrolling in the viewport shell", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("scrolls main for scroll keys while focus rests on the page", () => {
    const { main, scrollBy } = renderLayout()

    fireEvent.keyDown(document.body, { key: "PageDown" })
    fireEvent.keyDown(document.body, { key: " ", shiftKey: true })
    fireEvent.keyDown(document.body, { key: "ArrowDown", repeat: true })

    expect(scrollBy.mock.calls.map(([options]) => options)).toStrictEqual([
      { top: 700, behavior: "smooth" },
      { top: -700, behavior: "smooth" },
      { top: 40, behavior: "instant" },
    ])
    // Focus stays on the page, so the first Tab still reaches the skip link.
    expect(document.activeElement).toBe(document.body)
    expect(main.tabIndex).toBe(-1)
  })

  it("leaves keys alone when something else has focus", () => {
    const { scrollBy } = renderLayout()
    const input = document.querySelector("input")
    input?.focus()

    fireEvent.keyDown(input!, { key: " " })
    fireEvent.keyDown(document.body, { key: "PageDown" })

    expect(scrollBy).not.toHaveBeenCalled()
  })

  it("leaves modified, handled, and unrelated keys alone", () => {
    const { scrollBy } = renderLayout()

    fireEvent.keyDown(document.body, { key: "ArrowDown", altKey: true })
    fireEvent.keyDown(document.body, { key: "End", metaKey: true })
    fireEvent.keyDown(document.body, { key: "a" })
    document.addEventListener("keydown", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    })
    fireEvent.keyDown(document.body, { key: "PageDown" })

    expect(scrollBy).not.toHaveBeenCalled()
  })

  it("lets another scroller the reader clicked keep the keyboard", () => {
    const { scrollBy } = renderLayout()
    const sidebar = document.createElement("nav")
    makeScroller(sidebar)
    sidebar.append(document.createElement("span"))
    document.body.prepend(sidebar)

    fireEvent.pointerDown(sidebar.firstChild!)
    fireEvent.keyDown(document.body, { key: "PageDown" })
    fireEvent.pointerDown(document.querySelector("p")!)
    fireEvent.keyDown(document.body, { key: "PageDown" })

    expect(scrollBy).toHaveBeenCalledOnce()
  })

  it.each([{ scrollMode: "document" as const }, { bare: true }])(
    "does nothing when the document scrolls instead (%o)",
    (props) => {
      const { scrollBy } = renderLayout(props)

      fireEvent.keyDown(document.body, { key: "PageDown" })

      expect(scrollBy).not.toHaveBeenCalled()
    }
  )
})

function runScript() {
  // The script is inline page code; run it as the browser would.
  // eslint-disable-next-line typescript/no-implied-eval, no-new-func
  new Function(MAIN_SCROLL_RESTORATION_SCRIPT)()
}

describe("main scroll restoration", () => {
  let navigationType: string | undefined
  let main: HTMLElement

  const key = `${MAIN_SCROLL_STORAGE_PREFIX}/guide/`

  beforeEach(() => {
    navigationType = "reload"
    vi.spyOn(performance, "getEntriesByType").mockImplementation(() =>
      // eslint-disable-next-line typescript/no-unsafe-type-assertion
      navigationType == null ? [] : [{ type: navigationType } as PerformanceNavigationTiming]
    )
    globalThis.history.replaceState(null, "", "/guide/")
    sessionStorage.clear()
    main = document.createElement("main")
    main.id = "main-content"
    makeScroller(main)
    document.body.append(main)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ""
    sessionStorage.clear()
  })

  it("saves the position when the page is left", () => {
    runScript()
    main.scrollTop = 1234

    globalThis.dispatchEvent(new Event("pagehide"))

    expect(sessionStorage.getItem(key)).toBe("1234")
  })

  it.each(["reload", "back_forward"])("restores the position on %s", (type) => {
    navigationType = type
    sessionStorage.setItem(key, "900")

    runScript()

    expect(main.scrollTop).toBe(900)
  })

  it("starts at the top after a fresh navigation", () => {
    navigationType = "navigate"
    sessionStorage.setItem(key, "900")

    runScript()

    expect(main.scrollTop).toBe(0)
  })

  it("leaves a fragment target to the browser", () => {
    globalThis.history.replaceState(null, "", "/guide/#install")
    sessionStorage.setItem(key, "900")

    runScript()

    expect(main.scrollTop).toBe(0)
  })

  it("survives storage that throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })

    expect(runScript).not.toThrow()
    main.scrollTop = 50
    expect(() => globalThis.dispatchEvent(new Event("pagehide"))).not.toThrow()
  })

  it("is part of the default HTML shell, after the app markup", () => {
    const html = renderToStaticMarkup(
      <ArdoRootLayout>
        <div id="ardo-app" />
      </ArdoRootLayout>
    )

    expect(html).toContain(`<div id="ardo-app"></div><script>${MAIN_SCROLL_RESTORATION_SCRIPT}`)
  })
})
