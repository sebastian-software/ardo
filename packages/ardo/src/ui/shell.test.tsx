import type { ReactNode, RefObject } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoRoot } from "./ArdoRoot"
import { ArdoFooter } from "./Footer"
import { ArdoHeader } from "./Header"
import { MobileSlidePanel } from "./MobileSlidePanel"
import { ArdoNav, ArdoNavLink } from "./Nav"
import { ArdoSidebar } from "./Sidebar"

vi.mock("virtual:ardo/search-index", () => ({ default: [] }))

const config = { title: "Docs" }
const triggerRef: RefObject<HTMLButtonElement | null> = { current: null }
const closeMobilePanel = vi.fn<() => void>()

function renderShell(children: ReactNode): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ArdoProvider config={config} sidebar={[]}>
        {children}
      </ArdoProvider>
    </MemoryRouter>
  )
}

function renderRootRoute(element: ReactNode, handle?: unknown): string {
  const router = createMemoryRouter([{ path: "/", element, handle }], { initialEntries: ["/"] })
  return renderToStaticMarkup(<RouterProvider router={router} />)
}

describe("UI shell landmarks", () => {
  it("keeps stable hook classes on default landmarks", () => {
    const view = renderShell(
      <>
        <ArdoHeader />
        <ArdoNav>
          <ArdoNavLink to="/guide">Guide</ArdoNavLink>
        </ArdoNav>
        <ArdoSidebar />
        <MobileSlidePanel title="Docs" triggerRef={triggerRef} onClose={closeMobilePanel}>
          <span>Panel</span>
        </MobileSlidePanel>
        <ArdoFooter />
      </>
    )

    expect(view).toContain("ardo-header")
    expect(view).toContain("ardo-nav")
    expect(view).toContain("ardo-sidebar")
    expect(view).toContain("ardo-mobile-panel")
    expect(view).toContain("ardo-footer")
  })

  it("renders the mobile menu trigger when only nav is provided", () => {
    const view = renderShell(
      <ArdoHeader
        nav={
          <ArdoNav>
            <ArdoNavLink to="/guide">Guide</ArdoNavLink>
          </ArdoNav>
        }
      />
    )

    expect(view).toContain('aria-label="Toggle menu"')
    expect(view).toContain('aria-expanded="false"')
  })

  it("honors explicit null header and footer overrides", () => {
    const view = renderRootRoute(
      <ArdoRoot config={config} sidebar={[]} header={null} footer={null}>
        <p>Content</p>
      </ArdoRoot>
    )

    expect(view).toContain("Content")
    expect(view).not.toContain("ardo-header")
    expect(view).not.toContain("ardo-footer")
  })

  it("suppresses route chrome from the route handle", () => {
    const view = renderRootRoute(
      <ArdoRoot config={config} sidebar={[]}>
        <p>Landing</p>
      </ArdoRoot>,
      { chrome: false, layout: "bare" }
    )

    expect(view).toContain("Landing")
    expect(view).not.toContain("ardo-header")
    expect(view).not.toContain("ardo-footer")
  })

  it("applies brand hue styles and logo defaults", () => {
    const view = renderRootRoute(
      <ArdoRoot
        config={{
          title: "Docs",
          brand: {
            color: "blue",
            accent: "teal",
            neutral: "slate",
            logo: "/logo.svg",
          },
        }}
        sidebar={[]}
      >
        <p>Content</p>
      </ArdoRoot>
    )

    expect(view).toContain("data-ardo-brand")
    expect(view).toContain("--ardo-hue-brand:240")
    expect(view).toContain("--ardo-hue-accent:170")
    expect(view).toContain("--ardo-hue-neutral:260")
    expect(view).toContain('<img src="/logo.svg" alt="Docs"')
  })
})
