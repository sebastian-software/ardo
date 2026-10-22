import type { ReactNode } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ArdoConfigProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoRoot } from "./ArdoRoot"

vi.mock("virtual:ardo/search-index", () => ({ default: [] }))

const config = { title: "Docs" }

function renderRoot(element: ReactNode): string {
  return renderToStaticMarkup(<ArdoPageProvider path="/guide">{element}</ArdoPageProvider>)
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

  it("renders a generated sidebar by default and none when sidebar is false", () => {
    const withSidebar = renderRoot(
      <ArdoRoot config={config}>
        <p>Content</p>
      </ArdoRoot>
    )
    const withoutSidebar = renderRoot(
      <ArdoRoot config={config} sidebar={false}>
        <p>Content</p>
      </ArdoRoot>
    )

    expect(withSidebar).toContain("ardo-sidebar")
    expect(withoutSidebar).not.toContain("ardo-sidebar")
  })

  it("reads the site config from Ardo's app when the prop is left out", () => {
    const view = renderToStaticMarkup(
      <ArdoPageProvider path="/guide">
        <ArdoConfigProvider config={{ title: "Context docs" }}>
          <ArdoRoot>
            <p>Content</p>
          </ArdoRoot>
        </ArdoConfigProvider>
      </ArdoPageProvider>
    )

    expect(view).toContain("Content")
    expect(view).toContain("Context docs")
  })

  it("explains a missing site config", () => {
    expect(() =>
      renderRoot(
        <ArdoRoot>
          <p>Content</p>
        </ArdoRoot>
      )
    ).toThrow("ArdoRoot has no site config")
  })
})
