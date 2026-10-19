import type { ReactNode } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { ArdoRoot } from "./ArdoRoot"

vi.mock("virtual:ardo/search-index", () => ({ default: [] }))

const config = { title: "Docs" }

function renderRoot(element: ReactNode): string {
  const router = createMemoryRouter([{ path: "*", element }], { initialEntries: ["/guide"] })
  return renderToStaticMarkup(<RouterProvider router={router} />)
}

describe("ArdoRoot chrome props", () => {
  it("renders custom header and footer components without replacing the page content", () => {
    const view = renderRoot(
      <ArdoRoot
        config={config}
        header={<header className="acme-header">Acme</header>}
        footer={<footer className="acme-footer">Acme footer</footer>}
      >
        <p>Content</p>
      </ArdoRoot>
    )

    expect(view).toContain("acme-header")
    expect(view).toContain("acme-footer")
    expect(view).toContain("Content")
    expect(view).not.toContain("ardo-header")
    expect(view).not.toContain("ardo-footer")
  })

  it("leaves out header and footer when they are set to false", () => {
    const view = renderRoot(
      <ArdoRoot config={config} header={false} footer={false}>
        <p>Content</p>
      </ArdoRoot>
    )

    expect(view).toContain("Content")
    expect(view).not.toContain("ardo-header")
    expect(view).not.toContain("ardo-footer")
  })
})
