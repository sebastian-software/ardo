/* eslint-disable import/first -- vi.mock must be hoisted before importing the component. */
import { renderToStaticMarkup, renderToString } from "react-dom/server"
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
  it("renders implicit tabs and panels without React key warnings", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {
      /* Collect React warnings without printing them. */
    })
    renderToStaticMarkup(
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

    const keyWarnings = error.mock.calls.filter((call) => String(call[0]).includes('unique "key"'))
    error.mockRestore()
    expect(keyWarnings).toStrictEqual([])
  })

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
    expect(view).toContain('hidden="">pnpm install</div>')
    expect(view).not.toContain('hidden="">npm install</div>')
  })

  it("prerenders every panel so each tab controls an existing panel", () => {
    const view = renderToString(
      <ArdoTabs>
        <ArdoTabList>
          <ArdoTab>pnpm</ArdoTab>
          <ArdoTab>npm</ArdoTab>
          <ArdoTab>yarn</ArdoTab>
        </ArdoTabList>
        <ArdoTabPanels>
          <ArdoTabPanel>pnpm install</ArdoTabPanel>
          <ArdoTabPanel>npm install</ArdoTabPanel>
          <ArdoTabPanel>yarn install</ArdoTabPanel>
        </ArdoTabPanels>
      </ArdoTabs>
    )

    const tabControlIds = [...view.matchAll(/aria-controls="([^"]+)"/gu)].map((match) => match[1])
    const panelIds = [...view.matchAll(/role="tabpanel" id="([^"]+)"/gu)].map((match) => match[1])
    expect(panelIds).toStrictEqual(tabControlIds)
    expect(view).toContain("pnpm install")
    expect(view).toContain("npm install")
    expect(view).toContain("yarn install")
    expect(view.match(/hidden=""/gu)).toHaveLength(2)
  })

  it("selects the first tab when defaultValue matches no tab", () => {
    const view = renderToStaticMarkup(
      <ArdoTabs defaultValue="missing">
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

    expect(view).toMatch(/aria-selected="true" tabindex="0"[^>]*>pnpm</u)
    expect(view).toContain('tabindex="0" class="tabPanel">pnpm install</div>')
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
    expect(panelIds).toStrictEqual(tabControlIds)
    expect(view).toContain('class="tabPanel">pnpm install</div>')
    expect(view).toContain('hidden="">npm install</div>')
  })
})
