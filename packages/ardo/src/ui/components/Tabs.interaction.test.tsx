// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ArdoTab, ArdoTabList, ArdoTabPanel, ArdoTabPanels, ArdoTabs } from "./Tabs"

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
