import type { ReactNode, RefObject } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { ArdoConfig } from "../config/types"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoFooter } from "./Footer"
import { ArdoHeader, ArdoHeaderActions } from "./Header"
import { ArdoLayoutVariantContext } from "./layout-context"
import { MobileSlidePanel } from "./MobileSlidePanel"
import { ArdoSidebar, ArdoSidebarLink } from "./Sidebar"
import { ArdoVersionBanner } from "./site-controls"
import { getVersionHref } from "./version-path"

vi.mock("virtual:ardo/search-index", () => ({ default: [] }))

const versioning = (current: string): ArdoConfig["versioning"] => ({
  current,
  versions: [
    { id: "v3", label: "3.x", path: "/v3/" },
    { id: "v2", label: "2.x", path: "/v2/" },
  ],
})

const triggerRef: RefObject<HTMLButtonElement | null> = { current: null }

function render(node: ReactNode, current = "v3", layout: "bare" | "doc" = "doc"): string {
  return renderToStaticMarkup(
    <ArdoPageProvider base={`/${current}/`} path="/guide/setup">
      <ArdoProvider config={{ title: "Docs", versioning: versioning(current) }} sidebar={[]}>
        <ArdoLayoutVariantContext value={layout}>{node}</ArdoLayoutVariantContext>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

const versionSelect = 'aria-label="Version"'

describe("site controls", () => {
  it("keeps the version out of the header and shows it at the end of the sidebar", () => {
    expect(render(<ArdoHeader search={false} />)).not.toContain(versionSelect)

    const sidebar = render(
      <ArdoSidebar>
        <ArdoSidebarLink to="/guide/setup">Setup</ArdoSidebarLink>
      </ArdoSidebar>
    )
    expect(sidebar).toContain("ardo-version-control")
    expect(sidebar).toContain('<option value="v3" selected="">3.x</option>')
  })

  it("shows the version in the footer of bare pages only", () => {
    expect(render(<ArdoFooter />, "v3", "bare")).toContain("ardo-version-control")
    expect(render(<ArdoFooter />, "v3", "doc")).not.toContain("ardo-version-control")
  })

  it("collects version, appearance and links in the mobile menu, once", () => {
    const view = render(
      <MobileSlidePanel
        title="Docs"
        actions={<a href="https://github.com/acme">GitHub</a>}
        themeToggle
        triggerRef={triggerRef}
        onClose={vi.fn()}
      >
        <ArdoSidebar>
          <ArdoSidebarLink to="/guide/setup">Setup</ArdoSidebarLink>
        </ArdoSidebar>
      </MobileSlidePanel>
    )

    expect(view).toContain("ardo-mobile-panel-settings")
    expect(view.split(versionSelect)).toHaveLength(2)
    expect(view).not.toContain("ardo-version-control")
    expect(view).toContain("Appearance")
    expect(view).toContain('href="https://github.com/acme"')
  })

  it("offers the menu on narrow screens even without a sidebar or nav", () => {
    const view = render(
      <ArdoHeader search={false}>
        <ArdoHeaderActions>
          <a href="https://github.com/acme">GitHub</a>
        </ArdoHeaderActions>
      </ArdoHeader>,
      "v3",
      "bare"
    )

    expect(view).toContain('aria-label="Toggle menu"')
  })

  it("points readers of an older version to the same page in the latest one", () => {
    expect(render(<ArdoVersionBanner />, "v3")).toBe("")
    const banner = render(<ArdoVersionBanner />, "v2")
    expect(banner).toContain("You are reading the documentation for 2.x.")
    expect(banner).toContain('href="/v3/guide/setup"')
  })

  it("builds the address of the same page in another version", () => {
    expect(getVersionHref("/guide/setup", "/v2/")).toBe("/v2/guide/setup")
    expect(getVersionHref("/guide/setup", "/docs/v2")).toBe("/docs/v2/guide/setup")
    expect(getVersionHref("/", "/v2/")).toBe("/v2/")
  })
})
