// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StrictMode, useState } from "react"
import { describe, expect, it } from "vitest"

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
})
