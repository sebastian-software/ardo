import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import type { SidebarItem } from "../config/types"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoSidebar } from "./Sidebar"

function renderSidebar(items: SidebarItem[], currentPath = "/"): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[currentPath]}>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
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

  it("marks a linked parent as active only on its own page", () => {
    const items: SidebarItem[] = [
      {
        text: "Architecture Decision Records",
        link: "/adr",
        items: [{ text: "ADR-0003", link: "/adr/0003-bitmask-hashing" }],
      },
    ]

    const parentLinkClass = (view: string) =>
      /<a [^>]*class="([^"]*sidebarLink[^"]*)"[^>]*href="\/adr"/.exec(view)?.[1] ?? ""

    const onOverview = parentLinkClass(renderSidebar(items, "/adr"))
    expect(onOverview.split(/\s+/)).toContain("active")

    const onChild = parentLinkClass(renderSidebar(items, "/adr/0003-bitmask-hashing"))
    expect(onChild).toContain("child-active")
    expect(onChild.split(/\s+/)).not.toContain("active")
  })
})
