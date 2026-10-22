// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react"
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

afterEach(() => vi.unstubAllGlobals())

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
})
