/* eslint-disable import/first -- vi.mock must be hoisted before importing the component. */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("./Banner.css", () => ({
  banner: ({ variant }: { variant: string }) => `banner banner-${variant}`,
  bannerIcon: ({ variant }: { variant: string }) => `banner-icon banner-icon-${variant}`,
  bannerBody: "banner-body",
  dismiss: "dismiss",
}))

import { ArdoBanner, ArdoPageBanner } from "./Banner"

describe("ArdoBanner", () => {
  it("renders a note with the requested variant and its children", () => {
    const view = renderToStaticMarkup(
      <ArdoBanner variant="warning">
        <a href="/release">Read the release notes</a>
      </ArdoBanner>
    )

    expect(view).toContain('role="note"')
    expect(view).toContain('class="banner banner-warning"')
    expect(view).toContain('<a href="/release">Read the release notes</a>')
    expect(view).not.toContain("<button")
  })

  it("defaults to the info variant", () => {
    const view = renderToStaticMarkup(<ArdoBanner>Notice</ArdoBanner>)

    expect(view).toContain('class="banner banner-info"')
  })

  it("adds a custom class", () => {
    const view = renderToStaticMarkup(<ArdoBanner className="intro">Notice</ArdoBanner>)

    expect(view).toContain('class="banner banner-info intro"')
  })
})

describe("ArdoPageBanner", () => {
  it("renders the content as text in the static markup", () => {
    const view = renderToStaticMarkup(
      <ArdoPageBanner banner={{ content: "Version 7 is in beta.", variant: "tip" }} />
    )

    expect(view).toContain('role="note"')
    expect(view).toContain('class="banner banner-tip"')
    expect(view).toContain("Version 7 is in beta.")
  })

  it("renders no close button before hydration, so it stays static without JavaScript", () => {
    const view = renderToStaticMarkup(
      <ArdoPageBanner banner={{ content: "Dismissible", dismissible: true, id: "release-7" }} />
    )

    expect(view).toContain("Dismissible")
    expect(view).not.toContain("<button")
  })
})
