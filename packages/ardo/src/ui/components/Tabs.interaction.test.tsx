// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StrictMode, useState } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ArdoTab, ArdoTabList, ArdoTabPanel, ArdoTabPanels, ArdoTabs } from "./Tabs"

function OpaqueContent() {
  return <span>Opaque content</span>
}

function ImplicitTabsHarness() {
  const [revision, setRevision] = useState(0)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRevision(revision + 1)
        }}
      >
        Rerender parent
      </button>
      <ArdoTabs>
        <OpaqueContent />
        <ArdoTabList>
          <ArdoTab>pnpm {revision}</ArdoTab>
          <ArdoTab>npm</ArdoTab>
        </ArdoTabList>
        <ArdoTabPanels>
          <ArdoTabPanel>pnpm install</ArdoTabPanel>
          <ArdoTabPanel>npm install</ArdoTabPanel>
        </ArdoTabPanels>
      </ArdoTabs>
    </>
  )
}

function NestedTabsHarness() {
  return (
    <ArdoTabs>
      <ArdoTabs defaultValue="inner-first">
        <ArdoTabList>
          <ArdoTab value="inner-first">Inner first</ArdoTab>
          <ArdoTab value="inner-second">Inner second</ArdoTab>
        </ArdoTabList>
        <ArdoTabPanels>
          <ArdoTabPanel value="inner-first">Inner first panel</ArdoTabPanel>
          <ArdoTabPanel value="inner-second">Inner second panel</ArdoTabPanel>
        </ArdoTabPanels>
      </ArdoTabs>
      <ArdoTabList>
        <ArdoTab>Outer first</ArdoTab>
        <ArdoTab>Outer second</ArdoTab>
      </ArdoTabList>
      <ArdoTabPanels>
        <ArdoTabPanel>Outer first panel</ArdoTabPanel>
        <ArdoTabPanel>Outer second panel</ArdoTabPanel>
      </ArdoTabPanels>
    </ArdoTabs>
  )
}

function CustomTab() {
  return <ArdoTab value="api">API</ArdoTab>
}

function panelFor(tab: HTMLElement): HTMLElement {
  const panel = document.getElementById(String(tab.getAttribute("aria-controls")))
  if (panel == null) throw new Error("Tab controls no panel")
  return panel
}

function renderTabs() {
  render(
    <ArdoTabs defaultValue="api">
      <ArdoTabList>
        <ArdoTab value="guide">Guide</ArdoTab>
        <ArdoTab value="api">API</ArdoTab>
        <ArdoTab value="examples">Examples</ArdoTab>
      </ArdoTabList>
      <ArdoTabPanels>
        <ArdoTabPanel value="guide">Guide panel</ArdoTabPanel>
        <ArdoTabPanel value="api">API panel</ArdoTabPanel>
        <ArdoTabPanel value="examples">Examples panel</ArdoTabPanel>
      </ArdoTabPanels>
    </ArdoTabs>
  )
}

describe("ArdoTabs interactions", () => {
  it("keeps nested tab groups in independent implicit value spaces", async () => {
    const user = userEvent.setup()
    render(<NestedTabsHarness />)

    expect(screen.getByRole("tab", { name: "Outer first" }).getAttribute("aria-selected")).toBe(
      "true"
    )
    expect(screen.getByText("Inner first panel")).toBeTruthy()
    expect(screen.getByText("Outer first panel")).toBeTruthy()

    await user.click(screen.getByRole("tab", { name: "Inner second" }))
    expect(screen.getByText("Inner second panel")).toBeTruthy()
    expect(screen.getByText("Outer first panel")).toBeTruthy()

    await user.click(screen.getByRole("tab", { name: "Outer second" }))
    expect(screen.getByText("Inner second panel")).toBeTruthy()
    expect(screen.getByText("Outer second panel")).toBeTruthy()
  })

  it("keeps implicit tab-panel values stable through StrictMode rerenders and clicks", async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <ImplicitTabsHarness />
      </StrictMode>
    )
    expect(screen.getByText("Opaque content")).toBeTruthy()

    await user.click(screen.getByRole("tab", { name: "npm" }))
    expect(screen.getByRole("tabpanel").textContent).toBe("npm install")

    await user.click(screen.getByRole("button", { name: "Rerender parent" }))

    expect(screen.getByRole("tab", { name: "npm" }).getAttribute("aria-selected")).toBe("true")
    expect(screen.getByRole("tabpanel").textContent).toBe("npm install")

    await user.click(screen.getByRole("tab", { name: "pnpm 1" }))
    expect(screen.getByRole("tabpanel").textContent).toBe("pnpm install")
  })

  it("honors defaultValue and switches panels on click", async () => {
    const user = userEvent.setup()
    renderTabs()

    expect(screen.getByRole("tabpanel").textContent).toBe("API panel")

    await user.click(screen.getByRole("tab", { name: "Guide" }))

    expect(screen.getByRole("tabpanel").textContent).toBe("Guide panel")
  })

  it("supports arrow-key roving between tabs", async () => {
    const user = userEvent.setup()
    renderTabs()
    const apiTab = screen.getByRole("tab", { name: "API" })

    apiTab.focus()
    await user.keyboard("{ArrowRight}")

    expect(document.activeElement?.textContent).toBe("Examples")
    expect(screen.getByRole("tabpanel").textContent).toBe("Examples panel")

    await user.keyboard("{Home}")

    expect(document.activeElement?.textContent).toBe("Guide")
    expect(screen.getByRole("tabpanel").textContent).toBe("Guide panel")
  })

  it("keeps inactive panels searchable and wires every tab to an existing panel", () => {
    renderTabs()

    const tabs = screen.getAllByRole("tab")
    const panels = tabs.map((tab) => panelFor(tab))
    expect(panels.map((panel) => panel.getAttribute("aria-labelledby"))).toStrictEqual(
      tabs.map((tab) => tab.id)
    )
    expect(panels.map((panel) => panel.getAttribute("hidden"))).toStrictEqual([
      "until-found",
      null,
      "until-found",
    ])
  })

  it("activates the tab whose panel find-in-page reveals", () => {
    renderTabs()
    const guide = screen.getByRole("tab", { name: "Guide" })
    const panel = panelFor(guide)

    act(() => {
      panel.dispatchEvent(new Event("beforematch"))
    })

    expect(guide.getAttribute("aria-selected")).toBe("true")
    expect(panel.hasAttribute("hidden")).toBe(false)
    expect(screen.getByRole("tabpanel").textContent).toBe("Guide panel")
  })

  it("keeps the tablist keyboard reachable when defaultValue matches no tab", async () => {
    const user = userEvent.setup()
    render(
      <ArdoTabs defaultValue="missing">
        <ArdoTabList>
          <ArdoTab value="guide">Guide</ArdoTab>
          <ArdoTab value="api">API</ArdoTab>
        </ArdoTabList>
        <ArdoTabPanels>
          <ArdoTabPanel value="guide">Guide panel</ArdoTabPanel>
          <ArdoTabPanel value="api">API panel</ArdoTabPanel>
        </ArdoTabPanels>
      </ArdoTabs>
    )

    await user.tab()
    expect(document.activeElement?.textContent).toBe("Guide")
    expect(screen.getByRole("tabpanel").textContent).toBe("Guide panel")
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tabpanel").textContent).toBe("API panel")
  })

  it("keeps selecting tabs that a custom component renders", async () => {
    const user = userEvent.setup()
    render(
      <ArdoTabs defaultValue="api">
        <ArdoTabList>
          <ArdoTab value="guide">Guide</ArdoTab>
          <CustomTab />
        </ArdoTabList>
        <ArdoTabPanels>
          <ArdoTabPanel value="guide">Guide panel</ArdoTabPanel>
          <ArdoTabPanel value="api">API panel</ArdoTabPanel>
        </ArdoTabPanels>
      </ArdoTabs>
    )

    expect(screen.getByRole("tabpanel").textContent).toBe("API panel")
    await user.click(screen.getByRole("tab", { name: "Guide" }))
    expect(screen.getByRole("tabpanel").textContent).toBe("Guide panel")
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tabpanel").textContent).toBe("API panel")
  })

  it("hydrates the prerendered panels without warnings", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {
      /* Collect React warnings without printing them. */
    })
    const tabs = (
      <ArdoTabs>
        <ArdoTabList>
          <ArdoTab>pnpm</ArdoTab>
          <ArdoTab>npm</ArdoTab>
        </ArdoTabList>
        <ArdoTabPanels>
          <ArdoTabPanel>pnpm install</ArdoTabPanel>
          <ArdoTabPanel>npm install</ArdoTabPanel>
        </ArdoTabPanels>
      </ArdoTabs>
    )
    const container = document.createElement("div")
    container.innerHTML = renderToString(tabs)
    document.body.append(container)

    const root = await act(async () => hydrateRoot(container, tabs))
    const panels = container.querySelectorAll('[role="tabpanel"]')
    expect([...panels].map((panel) => panel.getAttribute("hidden"))).toStrictEqual([
      null,
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
