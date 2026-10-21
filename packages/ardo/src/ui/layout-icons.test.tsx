import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoRootLayout } from "./Layout"

describe("root layout site identity", () => {
  it.each(["/mark-64.png", "/favicon.ico", "/brand.svg", "/mark.png?v=2"])(
    "lets the response declare the MIME type for a custom URL: %s",
    (favicon) => {
      const view = renderToStaticMarkup(
        <ArdoRootLayout favicon={favicon} iconBasePath={false}>
          <p>Custom site</p>
        </ArdoRootLayout>
      )
      expect(view).toContain(`href="${favicon}"`)
      expect(view).not.toContain('type="image/svg+xml"')
      expect(view.match(/rel="icon"/g)).toHaveLength(1)
    }
  )

  it("places a site token scope on html for content and body portals", () => {
    const view = renderToStaticMarkup(
      <ArdoRootLayout className="site-tokens" iconBasePath={false}>
        <p>Custom site</p>
      </ArdoRootLayout>
    )
    expect(view).toContain('<html lang="en" class="site-tokens">')
  })

  it("preserves the generated icon URLs and their SVG type", () => {
    const view = renderToStaticMarkup(
      <ArdoRootLayout iconBasePath="/docs/">
        <p>Default site</p>
      </ArdoRootLayout>
    )
    expect(view).toContain('href="/docs/favicon.ico"')
    expect(view).toContain('href="/docs/icon.svg" type="image/svg+xml"')
    expect(view).toContain('href="/docs/apple-touch-icon.png"')
  })

  it("uses the inline SVG fallback when generated icons are disabled", () => {
    const view = renderToStaticMarkup(
      <ArdoRootLayout iconBasePath={false}>
        <p>Fallback</p>
      </ArdoRootLayout>
    )
    expect(view).toContain('type="image/svg+xml"')
    expect(view).toContain('href="data:image/svg+xml')
  })
})
