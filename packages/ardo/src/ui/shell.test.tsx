import type { ReactNode, RefObject } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoRoot } from "./ArdoRoot"
import { ArdoFooter } from "./Footer"
import { ArdoHeader } from "./Header"
import * as headerStyles from "./Header.css"
import * as layoutStyles from "./Layout.css"
import { MobileSlidePanel } from "./MobileSlidePanel"
import { ArdoNav, ArdoNavLink } from "./Nav"
import { ArdoSidebar, ArdoSidebarLink, ArdoSidebarSection } from "./Sidebar"
import { getVersionedPath } from "./version-path"

vi.mock("virtual:ardo/search-index", () => ({ default: [] }))

const config = { title: "Docs" }
const triggerRef: RefObject<HTMLButtonElement | null> = { current: null }
const closeMobilePanel = vi.fn<() => void>()

function renderShell(children: ReactNode): string {
  return renderToStaticMarkup(
    <ArdoPageProvider>
      <ArdoProvider config={config} sidebar={[]}>
        {children}
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

function renderRootRoute(element: ReactNode, handle?: unknown, initialPath = "/"): string {
  return renderToStaticMarkup(
    <ArdoPageProvider handle={handle} path={initialPath}>
      {element}
    </ArdoPageProvider>
  )
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
      <ArdoHeader>
        <ArdoNav>
          <ArdoNavLink to="/guide">Guide</ArdoNavLink>
        </ArdoNav>
      </ArdoHeader>
    )

    expect(view).toContain('aria-label="Toggle menu"')
    expect(view).toContain('aria-expanded="false"')
  })

  it("renders a compact version switcher when major docs versions are configured", () => {
    const view = renderToStaticMarkup(
      <ArdoPageProvider path="/v3/guide">
        <ArdoProvider
          config={{
            title: "Docs",
            versioning: {
              current: "v3",
              versions: [
                { id: "v3", label: "3.x", path: "/v3/" },
                { id: "v2", label: "2.x", path: "/v2/" },
              ],
            },
          }}
          sidebar={[]}
        >
          <ArdoHeader search={false} />
        </ArdoProvider>
      </ArdoPageProvider>
    )

    expect(view).toContain('aria-label="Documentation version"')
    expect(view).toContain('<option value="v3" selected="">3.x</option>')
    expect(view).toContain('<option value="v2">2.x</option>')
  })

  it("preserves the equivalent route path when switching documentation versions", () => {
    expect(getVersionedPath("/v3/guide/getting-started", "/v3/", "/v2/")).toBe(
      "/v2/guide/getting-started"
    )
    expect(getVersionedPath("/docs/v3/guide/getting-started", "/docs/v3/", "/docs/v2/")).toBe(
      "/docs/v2/guide/getting-started"
    )
    expect(getVersionedPath("/v3/", "/v3/", "/v2/")).toBe("/v2/")
    expect(getVersionedPath("/unversioned", "/v3/", "/v2/")).toBe("/v2/")
  })

  it("extracts JSX chrome children around route content", () => {
    const view = renderRootRoute(
      <ArdoRoot config={config}>
        <ArdoHeader search={false} />
        <ArdoSidebar>
          <ArdoSidebarSection id="guide" label="Guide" to="/guide">
            <ArdoSidebarLink to="/guide">Guide</ArdoSidebarLink>
          </ArdoSidebarSection>
        </ArdoSidebar>
        <ArdoFooter message="Docs footer" />
        <p>Content</p>
      </ArdoRoot>,
      undefined,
      "/guide"
    )

    expect(view).toContain("Content")
    expect(view).toContain("ardo-header")
    expect(view).toContain("ardo-sidebar")
    expect(view).toContain("Docs footer")
  })

  it("suppresses route chrome from the route handle", () => {
    const view = renderRootRoute(
      <ArdoRoot config={config}>
        <p>Landing</p>
      </ArdoRoot>,
      { chrome: false, layout: "bare" }
    )

    expect(view).toContain("Landing")
    expect(view).not.toContain("ardo-header")
    expect(view).not.toContain("ardo-footer")
    expect(view).not.toContain('href="#main-content"')
    expect(view).not.toContain(layoutStyles.withHeader)
    expect(view).toContain('<main id="main-content">')
  })

  it("keeps the skip link and fixed-header spacing for bare routes with built-in chrome", () => {
    const view = renderRootRoute(
      <ArdoRoot config={config}>
        <p>Landing</p>
      </ArdoRoot>,
      { layout: "bare" }
    )
    expect(view).toContain("ardo-header")
    expect(view).toContain(layoutStyles.withHeader)
    expect(view).toContain('href="#main-content"')
    expect(view).toContain('<main id="main-content">')
  })

  it("shows a centered search field on docs routes", () => {
    const view = renderRootRoute(
      <ArdoRoot config={config}>
        <p>Guide</p>
      </ArdoRoot>,
      undefined,
      "/guide"
    )
    expect(view).toContain('role="combobox"')
    expect(view).not.toContain(headerStyles.headerContainerPage)
  })

  it("collapses search to an icon and uses the page frame on bare routes", () => {
    const view = renderRootRoute(
      <ArdoRoot config={config}>
        <p>Landing</p>
      </ArdoRoot>,
      { layout: "bare" },
      "/landing"
    )
    expect(view).not.toContain('role="combobox"')
    expect(view).toContain('aria-label="Search"')
    expect(view).toContain('aria-keyshortcuts="Meta+K Control+K"')
    expect(view).toContain(headerStyles.headerContainerPage)
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
