/* eslint-disable import/first -- vi.mock must be hoisted before importing the component. */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("./Tabs.css", () => ({
  tab: "tab",
  tabList: "tabList",
  tabPanel: "tabPanel",
  tabPanels: "tabPanels",
  tabs: "tabs",
}))

import { ArdoTab, ArdoTabList, ArdoTabPanel, ArdoTabPanels, ArdoTabs } from "./Tabs"

describe("ArdoTabs", () => {
  it("links explicit tabs and panels with accessible ids", () => {
    const view = renderToStaticMarkup(
      <ArdoTabs defaultValue="npm">
        <ArdoTabList>
          <ArdoTab value="pnpm">pnpm</ArdoTab>
          <ArdoTab value="npm">npm</ArdoTab>
        </ArdoTabList>
        <ArdoTabPanels>
          <ArdoTabPanel value="pnpm">pnpm install</ArdoTabPanel>
          <ArdoTabPanel value="npm">npm install</ArdoTabPanel>
        </ArdoTabPanels>
      </ArdoTabs>
    )

    expect(view).toContain('role="tablist"')
    expect(view).toContain('aria-selected="false"')
    expect(view).toContain('aria-selected="true"')
    expect(view).toContain('tabindex="-1"')
    expect(view).toContain('tabindex="0"')
    expect(view).toMatch(/<button[^>]+id="([^"]+)"[^>]+aria-controls="([^"]+)"/u)
    expect(view).toMatch(/<div[^>]+role="tabpanel"[^>]+id="([^"]+)"[^>]+aria-labelledby="([^"]+)"/u)
    expect(view).toContain(">npm install</div>")
    expect(view).not.toContain("pnpm install")
  })

  it("keeps auto-generated tab values associated by order", () => {
    const view = renderToStaticMarkup(
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

    const tabControlIds = [...view.matchAll(/aria-controls="([^"]+)"/gu)].map((match) => match[1])
    const panelIds = [...view.matchAll(/role="tabpanel" id="([^"]+)"/gu)].map((match) => match[1])

    expect(tabControlIds).toHaveLength(2)
    expect(panelIds).toHaveLength(1)
    expect(tabControlIds[0]).toBe(panelIds[0])
    expect(view).toContain(">pnpm install</div>")
    expect(view).not.toContain(">npm install</div>")
  })
})
