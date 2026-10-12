// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoTOC } from "./Toc"

function renderToc() {
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
        toc: [{ id: "first", text: "First", level: 2 }],
      }}
    >
      <main id="main-content">
        <h2 id="first">First</h2>
        <ArdoTOC />
      </main>
    </ArdoProvider>
  )
}

afterEach(() => vi.unstubAllGlobals())

describe("TOC observer lifecycle", () => {
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
