import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import type { SidebarItem } from "../config/types"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoSidebar } from "./Sidebar"

function renderSidebar(items: SidebarItem[]): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={["/"]}>
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
})
