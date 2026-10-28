// @vitest-environment jsdom

import type { ReactNode } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { ArdoPageProvider } from "../runtime/page"
import { describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { createGeneratedSidebarSections } from "./generated-sections"
import { ArdoGeneratedSidebar } from "./GeneratedSidebar"
import {
  ArdoSidebar,
  ArdoSidebarGroup,
  ArdoSidebarLink,
  ArdoSidebarSection,
  resolveArdoSidebarItems,
} from "./Sidebar"
import { getSidebarScrollTop } from "./sidebar-scroll"

vi.mock("virtual:ardo/generated-sidebars", () => ({
  sectionIndexes: { api: "/api-reference" },
  default: {
    "de:guide": [{ text: "Einstieg", link: "/de/guide/start" }],
    "en:guide": [{ text: "Start", link: "/en/guide/start" }],
    adr: [
      {
        text: "Architecture Decision Records",
        link: "/adr",
        items: [{ text: "ADR-0003", link: "/adr/0003-bitmask-hashing" }],
      },
    ],
    api: [{ text: "API", items: [{ text: "Reference", link: "/api-reference" }] }],
    flat: [
      { text: "Intro", link: "/intro" },
      { text: "Setup", link: "/setup" },
    ],
    guide: [
      {
        text: "Guide",
        collapsed: true,
        items: [{ text: "Getting Started", link: "/guide/getting-started" }],
      },
    ],
  },
}))

function renderSidebar(children: ReactNode, currentPath = "/guide/getting-started"): string {
  return renderToStaticMarkup(
    <ArdoPageProvider path={currentPath}>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
        <ArdoSidebar>{children}</ArdoSidebar>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

function generatedSection(section: string, to = `/${section}`) {
  return (
    <ArdoSidebarSection id={section} label={section} to={to}>
      <ArdoGeneratedSidebar section={section} />
    </ArdoSidebarSection>
  )
}

const headerClass = (view: string) => {
  const header = (view.match(/<div [^>]*>/g) ?? []).find((tag) => tag.includes("sidebarNodeHeader"))
  return /class="([^"]*)"/.exec(header ?? "")?.[1] ?? ""
}

describe("ArdoSidebar", () => {
  it.each(["flat", "guide", "api"])(
    "renders valid lists for generated %s navigation",
    (section) => {
      const document = new DOMParser().parseFromString(
        renderSidebar(generatedSection(section)),
        "text/html"
      )
      expect(document.querySelectorAll(".ardo-sidebar-nav > ul")).toHaveLength(1)
      expect(document.querySelectorAll(".ardo-sidebar-nav ul > :not(li)")).toHaveLength(0)
    }
  )

  it("preserves manual items mixed with generated navigation in the same list", () => {
    const view = renderSidebar(
      <ArdoSidebarSection id="guide" label="Guide" to="/guide">
        <ArdoGeneratedSidebar section="flat" />
        <ArdoSidebarGroup title="More">
          <ArdoSidebarLink to="/custom">Custom guide</ArdoSidebarLink>
        </ArdoSidebarGroup>
      </ArdoSidebarSection>
    )
    const document = new DOMParser().parseFromString(view, "text/html")

    expect(document.querySelectorAll(".ardo-sidebar-nav > ul > li")).toHaveLength(3)
    expect(document.querySelectorAll(".ardo-sidebar-nav ul > :not(li)")).toHaveLength(0)
    expect(view).toContain("Custom guide")
  })

  it("connects collapsed generated group toggles to inert content", () => {
    const view = renderSidebar(generatedSection("guide"), "/guide/other")
    const toggle =
      /<button[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"[^>]*aria-label="Expand Guide"/.exec(
        view
      )

    expect(toggle).not.toBeNull()
    expect(view).toContain(`id="${toggle?.[1]}"`)
    expect(view).toContain('aria-hidden="true"')
    expect(view).toContain("inert")
  })

  it("opens a collapsed group on a page inside it", () => {
    const generated = renderSidebar(generatedSection("guide"))
    const manual = renderSidebar(
      <ArdoSidebarSection id="guide" label="Guide" to="/guide/getting-started">
        <ArdoSidebarGroup title="Guide" collapsed>
          <ArdoSidebarLink to="/guide/getting-started">Getting Started</ArdoSidebarLink>
        </ArdoSidebarGroup>
      </ArdoSidebarSection>
    )

    for (const view of [generated, manual]) {
      expect(view).toContain('aria-label="Collapse Guide"')
      expect(view).not.toContain('aria-label="Expand Guide"')
      expect(view).toContain('data-collapsed="false"')
    }
  })

  it("renders manual unlinked groups with a single toggle button", () => {
    const view = renderSidebar(
      <ArdoSidebarSection id="api" label="API" to="/api-reference">
        <ArdoSidebarGroup title="API">
          <ArdoSidebarLink to="/api-reference">Reference</ArdoSidebarLink>
        </ArdoSidebarGroup>
      </ArdoSidebarSection>,
      "/api-reference"
    )

    expect(view.match(/<button/g)).toHaveLength(1)
    expect(view).toContain('aria-expanded="true"')
    expect(view).toContain('aria-label="Collapse API"')
  })

  it("marks a linked generated group node active only on its own page", () => {
    const onOverview = headerClass(renderSidebar(generatedSection("adr"), "/adr"))
    expect(onOverview.split(/\s+/)).toContain("active")

    const onChild = headerClass(renderSidebar(generatedSection("adr"), "/adr/0003-bitmask-hashing"))
    expect(onChild).toContain("child-active")
    expect(onChild.split(/\s+/)).not.toContain("active")
  })

  it("keeps generated flat lists plain, without group headings", () => {
    const view = renderSidebar(generatedSection("flat", "/intro"), "/intro")

    expect(view).not.toContain("sidebarTrunk")
    expect(view).not.toContain("sidebarNodeHeader")
  })

  it("uses typographic group headings without repeated tree icons", () => {
    const view = renderSidebar(generatedSection("api", "/api-reference"), "/api-reference")

    expect(view).toContain("sidebarNodeHeader")
    expect(view).not.toContain("sidebarTrunk")
  })

  it("renders section tabs with visible labels and catalog icons", () => {
    const view = renderSidebar(
      <>
        {generatedSection("guide")}
        {generatedSection("api", "/api-reference")}
      </>
    )

    expect(view).toContain('aria-label="Documentation sections"')
    expect(view).toMatch(/<a [^>]*aria-current="true"[^>]*href="\/guide\/"/)
    expect(view).toMatch(
      /href="\/api-reference\/"[^>]*>.*?<svg[^>]*data-icon="api".*?<span>api<\/span>/
    )
    expect(view).toMatch(
      /href="\/guide\/"[^>]*>.*?<svg[^>]*data-icon="guide".*?<span>guide<\/span>/
    )
  })

  it("renders unknown sections as text-only tabs", () => {
    const view = renderSidebar(
      <>
        {generatedSection("guide")}
        {generatedSection("flat", "/intro")}
      </>
    )

    expect(view).toMatch(/href="\/intro\/"[^>]*><span[^>]*><span>flat<\/span>/)
  })

  it("lets an explicit icon replace or drop the catalog icon", () => {
    const view = renderSidebar(
      <>
        <ArdoSidebarSection id="guide" label="Guide" to="/guide" icon={<i data-icon="custom" />}>
          <ArdoSidebarLink to="/guide/getting-started">Getting Started</ArdoSidebarLink>
        </ArdoSidebarSection>
        <ArdoSidebarSection id="api" label="API" to="/api-reference" icon={null}>
          <ArdoSidebarLink to="/api-reference">API Reference</ArdoSidebarLink>
        </ArdoSidebarSection>
      </>
    )

    expect(view).toContain('data-icon="custom"')
    expect(view).not.toContain('data-icon="guide"')
    expect(view).not.toContain('data-icon="api"')
  })

  it("generates one section per route folder in catalog order", () => {
    const view = renderSidebar(createGeneratedSidebarSections({}, "/guide/getting-started"))
    const tabs = view.slice(0, view.indexOf("</nav>"))
    const labels = [...tabs.matchAll(/<span>([^<]+)<\/span><\/span><\/a>/g)].map(
      (match) => match[1]
    )

    expect(labels).toStrictEqual(["Guide", "API", "ADRs", "Flat"])
    expect(tabs).toContain('href="/guide/getting-started/"')
    expect(tabs).toContain('href="/adr/"')
  })

  it("puts sidebar.sectionOrder ahead of the catalog order", () => {
    const view = renderSidebar(
      createGeneratedSidebarSections(
        { sidebar: { sectionOrder: ["flat"] } },
        "/guide/getting-started"
      )
    )
    const tabs = view.slice(0, view.indexOf("</nav>"))
    const labels = [...tabs.matchAll(/<span>([^<]+)<\/span><\/span><\/a>/g)].map(
      (match) => match[1]
    )

    expect(labels).toStrictEqual(["Flat", "Guide", "API", "ADRs"])
    expect(tabs).toMatch(/aria-current="true"[^>]*href="\/guide\/getting-started\/"/)
  })

  it("leaves out the tabs when there is only one section", () => {
    const view = renderSidebar(generatedSection("guide"))

    expect(view).not.toContain('aria-label="Documentation sections"')
    expect(view).toContain("Getting Started")
  })

  it("switches the sidebar panel to the active section", () => {
    const view = renderSidebar(
      <>
        <ArdoSidebarSection id="guide" label="Guide" to="/guide">
          <ArdoSidebarLink to="/guide/getting-started">Getting Started</ArdoSidebarLink>
        </ArdoSidebarSection>
        <ArdoSidebarSection id="api" label="API" to="/api-reference">
          <ArdoSidebarLink to="/api-reference">API Reference</ArdoSidebarLink>
        </ArdoSidebarSection>
      </>,
      "/api-reference"
    )

    expect(view).toContain("API Reference")
    expect(view).not.toContain("Getting Started")
  })
})

describe("getSidebarScrollTop", () => {
  const nav = { top: 100, bottom: 700, height: 600 }

  it("leaves a fully visible active link alone", () => {
    expect(getSidebarScrollTop(nav, { top: 400, bottom: 430, height: 30 }, 0)).toBeUndefined()
  })
  it("scrolls a link below the fold into the upper third", () => {
    expect(getSidebarScrollTop(nav, { top: 1246, bottom: 1276, height: 30 }, 0)).toBe(946)
  })
  it("scrolls back up to a link above the visible area without going negative", () => {
    expect(getSidebarScrollTop(nav, { top: 40, bottom: 70, height: 30 }, 50)).toBe(0)
  })
})

it("uses the same localized generated items for the visible sidebar and page navigation", () => {
  const children = (
    <ArdoSidebarGroup title="Guide">
      <ArdoGeneratedSidebar section="guide" />
    </ArdoSidebarGroup>
  )
  const currentPath = "/de/guide/en/example"
  const items = resolveArdoSidebarItems(<ArdoSidebar>{children}</ArdoSidebar>, currentPath)
  expect(items).toStrictEqual([
    {
      text: "Guide",
      items: [{ text: "Einstieg", link: "/de/guide/start" }],
      link: undefined,
      collapsed: undefined,
    },
  ])
  const html = renderSidebar(children, currentPath)
  expect(html).toContain("Einstieg")
  expect(html).not.toContain('href="/en/guide/start/"')
})
