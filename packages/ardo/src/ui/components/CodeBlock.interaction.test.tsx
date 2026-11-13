// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ArdoCodeBlock, ArdoCodeGroup } from "./CodeBlock"

function CodeGroup() {
  return (
    <ArdoCodeGroup>
      <ArdoCodeBlock title="Configuration" language="ts" code="export default {}" />
      <ArdoCodeBlock title="Home route" language="md" code="# Welcome" />
      <ArdoCodeBlock title="Styles" language="css" code="body {}" />
    </ArdoCodeGroup>
  )
}

function panelFor(tab: HTMLElement): HTMLElement {
  const panel = document.getElementById(String(tab.getAttribute("aria-controls")))
  if (panel == null) throw new Error("Code group tab controls no panel")
  return panel
}

describe("ArdoCodeGroup interactions", () => {
  it("exposes tabs with selection state and associated panels", async () => {
    const user = userEvent.setup()
    render(<CodeGroup />)

    const configuration = screen.getByRole("tab", { name: "Configuration" })
    const home = screen.getByRole("tab", { name: "Home route" })
    expect(screen.getByRole("tablist")).toBeTruthy()
    expect(configuration.getAttribute("aria-selected")).toBe("true")
    expect(home.getAttribute("aria-selected")).toBe("false")
    expect(panelFor(configuration).getAttribute("aria-labelledby")).toBe(configuration.id)
    expect(panelFor(home).getAttribute("hidden")).toBe("until-found")

    await user.click(home)
    expect(home.getAttribute("aria-selected")).toBe("true")
    expect(screen.getByRole("tabpanel").textContent).toContain("# Welcome")
    expect(panelFor(configuration).getAttribute("hidden")).toBe("until-found")
  })

  it("moves between tabs with arrow, Home, and End keys", async () => {
    const user = userEvent.setup()
    render(<CodeGroup />)

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Configuration" }))
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Home route" }))
    expect(screen.getByRole("tabpanel").textContent).toContain("# Welcome")
    await user.keyboard("{End}")
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Styles" }))
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Configuration" }))
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("tab", { name: "Styles" }).getAttribute("aria-selected")).toBe("true")
  })

  it("keys tabs by position so blocks with the same label render without warnings", async () => {
    const user = userEvent.setup()
    const error = vi.spyOn(console, "error").mockImplementation(() => {
      /* Collect React warnings without printing them. */
    })
    render(
      <ArdoCodeGroup>
        <ArdoCodeBlock language="ts" code="const a = 1" />
        <ArdoCodeBlock language="ts" code="const b = 2" />
      </ArdoCodeGroup>
    )
    const calls = error.mock.calls
    error.mockRestore()
    expect(calls).toStrictEqual([])

    const [first, second] = screen.getAllByRole("tab", { name: "ts" })
    await user.click(second)
    expect(second.getAttribute("aria-selected")).toBe("true")
    expect(first.getAttribute("aria-selected")).toBe("false")
    expect(screen.getByRole("tabpanel").textContent).toContain("const b = 2")
  })

  it("activates the tab whose panel find-in-page reveals", () => {
    render(<CodeGroup />)
    const styles = screen.getByRole("tab", { name: "Styles" })
    const panel = panelFor(styles)

    act(() => {
      panel.dispatchEvent(new Event("beforematch"))
    })

    expect(styles.getAttribute("aria-selected")).toBe("true")
    expect(panel.hasAttribute("hidden")).toBe(false)
  })

  it("hydrates the prerendered panels without warnings", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {
      /* Collect React warnings without printing them. */
    })
    const container = document.createElement("div")
    container.innerHTML = renderToString(<CodeGroup />)
    document.body.append(container)

    const root = await act(async () => hydrateRoot(container, <CodeGroup />))
    const panels = container.querySelectorAll('[role="tabpanel"]')
    expect([...panels].map((panel) => panel.getAttribute("hidden"))).toStrictEqual([
      null,
      "until-found",
      "until-found",
    ])
    act(() => {
      root.unmount()
    })
    container.remove()
    const calls = error.mock.calls
    error.mockRestore()
    expect(calls).toStrictEqual([])
  })
})
