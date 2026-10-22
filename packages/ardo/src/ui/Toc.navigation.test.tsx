// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoTOC } from "./Toc"
import { scrollToHeading } from "./toc-navigation"

function renderNavigation() {
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
        toc: [{ id: "destination", text: "Destination", level: 2 }],
      }}
    >
      <main id="main-content" style={{ overflowY: "auto" }}>
        <ArdoTOC collapsible />
        <h2 id="destination">Destination</h2>
        <a href="#continue">Continue reading</a>
      </main>
    </ArdoProvider>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("TOC destination focus", () => {
  it("continues keyboard navigation at the chosen heading without an initial focus scroll", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("IntersectionObserver", undefined)
    vi.stubGlobal("matchMedia", () => ({ matches: true }))
    const view = renderNavigation()
    const heading = screen.getByRole("heading", { name: "Destination" })
    const focus = vi.spyOn(heading, "focus")
    const scrollIntoView = vi.spyOn(heading, "scrollIntoView").mockImplementation(vi.fn())
    await user.click(screen.getByText("On this page"))
    await user.click(screen.getByRole("link", { name: "Destination" }))
    expect(document.activeElement).toBe(heading)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" })
    expect(heading.getAttribute("tabindex")).toBe("-1")
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Continue reading" }))
    expect(heading.hasAttribute("tabindex")).toBe(false)
    view.unmount()
  })

  it("preserves an authored tabindex and smooth scrolling when motion is allowed", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }))
    const view = render(
      <>
        <h2 id="authored" tabIndex={0}>
          Authored heading
        </h2>
        <button type="button">Next</button>
      </>
    )
    const heading = screen.getByRole("heading")
    vi.spyOn(heading, "scrollIntoView").mockImplementation(vi.fn())
    expect(scrollToHeading("authored")).toBe(document)
    expect(heading.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" })
    screen.getByRole("button").focus()
    expect(heading.getAttribute("tabindex")).toBe("0")
    view.unmount()
  })

  it("leaves modified link activation to the browser", () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    const view = renderNavigation()
    const heading = screen.getByRole("heading", { name: "Destination" })
    vi.spyOn(heading, "scrollIntoView").mockImplementation(vi.fn())
    fireEvent.click(screen.getByText("On this page"))
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true })
    screen.getByRole("link", { name: "Destination" }).dispatchEvent(click)
    expect(click.defaultPrevented).toBe(false)
    expect(heading.scrollIntoView).not.toHaveBeenCalled()
    view.unmount()
  })
})
