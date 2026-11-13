// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { TOCItem } from "../config/types"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoTOC } from "./Toc"

function renderToc(
  overflowY: "auto" | "scroll" | "visible" = "visible",
  toc: TOCItem[] = [{ id: "first", text: "First", level: 2 }]
) {
  return render(
    <ArdoProvider
      config={{ title: "Docs" }}
      sidebar={[]}
      currentPage={{
        title: "Page",
        content: "",
        filePath: "",
        relativePath: "",
        frontmatter: {},
        toc,
      }}
    >
      <main id="main-content" style={{ overflowY }}>
        <h2 id="first">First</h2>
        <h3 id="child">Child</h3>
        <ArdoTOC />
      </main>
    </ArdoProvider>
  )
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

type ObserverEntry = { target: HTMLElement; isIntersecting: boolean }

function captureObserver() {
  const observer = { notify: (_entries: ObserverEntry[]) => {} }
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function createObserver(callback: (entries: ObserverEntry[]) => void) {
      observer.notify = callback
      return { observe: vi.fn(), disconnect: vi.fn() }
    })
  )
  return observer
}

function placeHeading(heading: HTMLElement, top: number) {
  vi.spyOn(heading, "getBoundingClientRect").mockReturnValue(new DOMRect(0, top, 600, 32))
}

function activeLink() {
  return document.querySelector('a[aria-current="location"]')?.textContent ?? ""
}

const flatToc: TOCItem[] = [
  { id: "first", text: "First", level: 2 },
  { id: "child", text: "Child", level: 3 },
]

describe("TOC observer lifecycle", () => {
  it("uses viewport height for its detection band and updates it after resizing", () => {
    const disconnect = vi.fn()
    const observer = vi.fn(function createObserver() {
      return { observe: vi.fn(), disconnect }
    })
    vi.stubGlobal("IntersectionObserver", observer)
    vi.stubGlobal("innerWidth", 1920)
    vi.stubGlobal("innerHeight", 900)
    const view = renderToc()
    expect(observer).toHaveBeenLastCalledWith(
      expect.any(Function),
      expect.objectContaining({ root: null, rootMargin: "-20px 0px -765px 0px" })
    )
    vi.stubGlobal("innerHeight", 600)
    act(() => {
      globalThis.dispatchEvent(new Event("resize"))
    })
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(observer).toHaveBeenLastCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: "-20px 0px -510px 0px" })
    )
    view.unmount()
  })

  it.each(["visible", "auto", "scroll"] as const)(
    "tracks the actual scroll root when main overflow is %s",
    (overflow) => {
      const observe = vi.fn()
      const observer = vi.fn(function createObserver() {
        return { observe, disconnect: vi.fn() }
      })
      vi.stubGlobal("IntersectionObserver", observer)
      const view = renderToc(overflow)
      expect(observer).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          root: overflow === "visible" ? null : screen.getByRole("main"),
        })
      )
      view.unmount()
    }
  )

  it("tracks nested subsections while reading", () => {
    const observe = vi.fn()
    let notify: (entries: Array<{ target: HTMLElement; isIntersecting: boolean }>) => void = vi.fn()
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(function observer(callback: typeof notify) {
        notify = callback
        return { observe, disconnect: vi.fn() }
      })
    )
    const view = renderToc("auto", [
      {
        id: "first",
        text: "First",
        level: 2,
        children: [{ id: "child", text: "Child", level: 3 }],
      },
    ])
    const child = screen.getByRole("heading", { name: "Child" })
    expect(observe).toHaveBeenCalledWith(child)
    act(() => notify([{ target: child, isIntersecting: true }]))
    expect(screen.getByRole("link", { name: "Child" }).getAttribute("aria-current")).toBe(
      "location"
    )
    expect(screen.getByRole("link", { name: "First" }).getAttribute("aria-current")).toBeNull()
    view.unmount()
  })

  it("disconnects its observer on unmount", () => {
    const observe = vi.fn()
    const unobserve = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(function observer() {
        return { observe, unobserve, disconnect }
      })
    )
    const view = renderToc()
    expect(observe).toHaveBeenCalledWith(screen.getByRole("heading", { name: "First" }))
    view.unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it("keeps navigation links available without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    const view = renderToc()
    expect(screen.getByRole("link", { name: "First" }).getAttribute("href")).toBe("#first")
    view.unmount()
  })

  it("marks the section being read again after scrolling back up", () => {
    vi.stubGlobal("innerHeight", 1000)
    const observer = captureObserver()
    const view = renderToc("visible", flatToc)
    const first = screen.getByRole("heading", { name: "First" })
    const child = screen.getByRole("heading", { name: "Child" })

    placeHeading(first, -600)
    placeHeading(child, 40)
    act(() => observer.notify([{ target: child, isIntersecting: true }]))
    expect(activeLink()).toBe("Child")

    // Back up into the body of First: Child leaves the band downwards and nothing enters it.
    placeHeading(first, -300)
    placeHeading(child, 320)
    act(() => observer.notify([{ target: child, isIntersecting: false }]))
    expect(activeLink()).toBe("First")
    view.unmount()
  })

  it("keeps the observer paused until the last of several quick outline clicks settles", () => {
    vi.useFakeTimers()
    vi.stubGlobal("matchMedia", () => ({ matches: true }))
    vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(vi.fn())
    const observer = captureObserver()
    const view = renderToc("visible", flatToc)
    const first = screen.getByRole("heading", { name: "First" })
    const child = screen.getByRole("heading", { name: "Child" })
    placeHeading(first, 0)
    placeHeading(child, 0)

    fireEvent.click(screen.getByRole("link", { name: "Child" }))
    act(() => vi.advanceTimersByTime(600))
    fireEvent.click(screen.getByRole("link", { name: "First" }))
    act(() => vi.advanceTimersByTime(600))
    act(() => observer.notify([{ target: child, isIntersecting: true }]))
    expect(activeLink()).toBe("First")

    act(() => vi.advanceTimersByTime(600))
    act(() => observer.notify([{ target: child, isIntersecting: true }]))
    expect(activeLink()).toBe("Child")
    view.unmount()
  })
})
