import type { ReactNode } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import {
  ArdoGeneratedSidebar,
  ArdoSidebar,
  ArdoSidebarGroup,
  ArdoSidebarLink,
  ArdoSidebarSection,
} from "./Sidebar"

vi.mock("virtual:ardo/generated-sidebars", () => ({
  default: {
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
    <MemoryRouter initialEntries={[currentPath]}>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
        <ArdoSidebar>{children}</ArdoSidebar>
      </ArdoProvider>
    </MemoryRouter>
  )
}

function generatedSection(section: string, to = `/${section}`) {
  return (
    <ArdoSidebarSection id={section} label={section} to={to}>
      <ArdoGeneratedSidebar section={section} />
    </ArdoSidebarSection>
  )
}

describe("ArdoSidebar", () => {
  it("connects collapsed generated group toggles to inert content", () => {
    const view = renderSidebar(generatedSection("guide"))
    const toggle =
      /<button[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"[^>]*aria-label="Expand Guide"/.exec(
        view
      )

    expect(toggle).not.toBeNull()
    expect(view).toContain(`id="${toggle?.[1]}"`)
    expect(view).toContain('aria-hidden="true"')
    expect(view).toContain("inert")
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
    const headerClass = (view: string) => {
      const header = (view.match(/<div [^>]*>/g) ?? []).find((tag) =>
        tag.includes("sidebarNodeHeader")
      )
      return /class="([^"]*)"/.exec(header ?? "")?.[1] ?? ""
    }

    const onOverview = headerClass(renderSidebar(generatedSection("adr"), "/adr"))
    expect(onOverview.split(/\s+/)).toContain("active")

    const onChild = headerClass(renderSidebar(generatedSection("adr"), "/adr/0003-bitmask-hashing"))
    expect(onChild).toContain("child-active")
    expect(onChild.split(/\s+/)).not.toContain("active")
  })

  it("keeps generated flat lists plain, without group nodes or a trunk", () => {
    const view = renderSidebar(generatedSection("flat", "/intro"), "/intro")

    expect(view).not.toContain("sidebarTrunk")
    expect(view).not.toContain("sidebarNodeHeader")
  })

  it("adds generated group nodes and a trunk when the list contains a group", () => {
    const view = renderSidebar(generatedSection("api", "/api-reference"), "/api-reference")

    expect(view).toContain("sidebarTrunk")
    expect(view).toContain("sidebarNodeHeader")
  })

  it("renders the rail from sidebar sections", () => {
    const view = renderSidebar(
      <>
        {generatedSection("guide")}
        {generatedSection("api", "/api-reference")}
      </>
    )

    expect(view).toContain('aria-label="Documentation sections"')
    expect(view).toContain('href="/guide"')
    expect(view).toContain('aria-label="guide"')
    expect(view).toContain('href="/api-reference"')
    expect(view).toContain('aria-label="api"')
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
