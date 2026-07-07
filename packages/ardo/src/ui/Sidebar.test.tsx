import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import type { ArdoContextItem, SidebarItem } from "../config/types"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoSidebar } from "./Sidebar"

type RenderOptions = {
  currentPath?: string
  contexts?: ArdoContextItem[]
}

function renderSidebar(
  items: SidebarItem[],
  { currentPath = "/", contexts }: RenderOptions = {}
): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[currentPath]}>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]} contexts={contexts}>
        <ArdoSidebar items={items} />
      </ArdoProvider>
    </MemoryRouter>
  )
}

describe("ArdoSidebar", () => {
  it("connects collapsed group toggles to inert content", () => {
    const view = renderSidebar([
      {
        text: "Guide",
        collapsed: true,
        items: [{ text: "Getting Started", link: "/guide/getting-started" }],
      },
    ])
    const toggle =
      /<button[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"[^>]*aria-label="Expand Guide"/.exec(
        view
      )

    expect(toggle).not.toBeNull()
    expect(view).toContain(`id="${toggle?.[1]}"`)
    expect(view).toContain('aria-hidden="true"')
    expect(view).toContain("inert")
  })

  it("renders unlinked groups with a single toggle button", () => {
    const view = renderSidebar([
      {
        text: "API",
        items: [{ text: "Reference", link: "/api-reference" }],
      },
    ])

    expect(view.match(/<button/g)).toHaveLength(1)
    expect(view).toContain('aria-expanded="true"')
    expect(view).toContain('aria-label="Collapse API"')
  })

  it("marks a linked group node active only on its own page", () => {
    const items: SidebarItem[] = [
      {
        text: "Architecture Decision Records",
        link: "/adr",
        items: [{ text: "ADR-0003", link: "/adr/0003-bitmask-hashing" }],
      },
    ]

    // A linked top-level group renders as a capsule node header that carries
    // the active/child-active state (its title `NavLink` uses `end`, so the
    // parent is only exactly-active on its own overview page).
    const headerClass = (view: string) => {
      const header = (view.match(/<div [^>]*>/g) ?? []).find((tag) =>
        tag.includes("sidebarNodeHeader")
      )
      return /class="([^"]*)"/.exec(header ?? "")?.[1] ?? ""
    }

    const onOverview = headerClass(renderSidebar(items, { currentPath: "/adr" }))
    expect(onOverview.split(/\s+/)).toContain("active")

    const onChild = headerClass(renderSidebar(items, { currentPath: "/adr/0003-bitmask-hashing" }))
    expect(onChild).toContain("child-active")
    expect(onChild.split(/\s+/)).not.toContain("active")
  })

  it("keeps flat lists plain, without group nodes or a trunk", () => {
    const view = renderSidebar([
      { text: "Intro", link: "/intro" },
      { text: "Setup", link: "/setup" },
    ])

    expect(view).not.toContain("sidebarTrunk")
    expect(view).not.toContain("sidebarNodeHeader")
  })

  it("adds group nodes and a trunk when the list contains a group", () => {
    const view = renderSidebar([
      { text: "Guide", items: [{ text: "Start", link: "/guide/start" }] },
    ])

    expect(view).toContain("sidebarTrunk")
    expect(view).toContain("sidebarNodeHeader")
  })

  it("keeps the rail surface without mirroring sections when no contexts exist", () => {
    const view = renderSidebar([
      { text: "API", items: [{ text: "Reference", link: "/api-reference" }] },
    ])

    // The rail surface stays for a consistent layout...
    expect(view).toContain("sidebarRail")
    // ...but it carries no navigation and never mirrors the sidebar sections.
    expect(view).not.toContain('aria-label="Documentation sections"')
    expect(view).not.toContain("sidebarRailLink")
  })

  it("renders the rail as a context switcher when contexts are configured", () => {
    const view = renderSidebar(
      [{ text: "API", items: [{ text: "Reference", link: "/api-reference" }] }],
      {
        contexts: [
          { id: "guide", label: "Guide", href: "/guide" },
          { id: "api-reference", label: "API Reference", href: "/api-reference" },
        ],
      }
    )

    expect(view).toContain('aria-label="Documentation sections"')
    expect(view).toContain('href="/guide"')
    expect(view).toContain('aria-label="Guide"')
    expect(view).toContain('href="/api-reference"')
    expect(view).toContain('aria-label="API Reference"')
  })

  it("keeps the rail empty for a single context (nothing to switch)", () => {
    const view = renderSidebar(
      [{ text: "API", items: [{ text: "Reference", link: "/api-reference" }] }],
      {
        contexts: [{ id: "guide", label: "Guide", href: "/guide" }],
      }
    )

    expect(view).toContain("sidebarRail")
    expect(view).not.toContain("sidebarRailLink")
    expect(view).not.toContain('aria-label="Documentation sections"')
  })
})
