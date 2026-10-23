import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoRootLayout } from "./Layout"
import { ArdoDocumentProvider } from "../runtime/document"

const document = {
  meta: [],
  stylesheets: [],
  modulePreloads: [],
  lang: "de",
  iconBasePath: "/project/",
}

describe("root layout site identity", () => {
  it("inherits language and generated icons outside the app provider", () => {
    const html = renderToStaticMarkup(
      <ArdoDocumentProvider value={document}>
        <ArdoRootLayout>
          <p>German site</p>
        </ArdoRootLayout>
      </ArdoDocumentProvider>
    )
    expect(html).toContain('<html lang="de">')
    for (const icon of ["icon.svg", "favicon.ico", "apple-touch-icon.png"])
      expect(html).toContain(`href="/project/${icon}"`)
  })

  it("keeps explicit layout props ahead of request defaults", () => {
    const html = renderToStaticMarkup(
      <ArdoDocumentProvider value={document}>
        <ArdoRootLayout lang="fr" iconBasePath={false}>
          <p>Custom site</p>
        </ArdoRootLayout>
      </ArdoDocumentProvider>
    )
    expect(html).toContain('<html lang="fr">')
    expect(html).not.toContain("/project/")
    expect(html).toContain('href="data:image/svg+xml')
  })

  it.each(["/mark-64.png", "/favicon.ico", "/brand.svg", "/mark.png?v=2"])(
    "lets the response declare the MIME type for a custom URL: %s",
    (icon) => {
      const view = renderToStaticMarkup(
        <ArdoRootLayout icon={icon} iconBasePath={false}>
          <p>Custom site</p>
        </ArdoRootLayout>
      )
      expect(view).toContain(`href="${icon}"`)
      expect(view).not.toContain('type="image/svg+xml"')
      expect(view.match(/rel="icon"/g)).toHaveLength(1)
    }
  )

  it("links the icons ArdoRoot registered instead of the generated owl", () => {
    const view = renderToStaticMarkup(
      <ArdoDocumentProvider
        value={{
          ...document,
          icon: "/assets/icon-a1b2.svg",
          appleTouchIcon: "/assets/apple-c3d4.png",
        }}
      >
        <ArdoRootLayout>
          <p>Branded site</p>
        </ArdoRootLayout>
      </ArdoDocumentProvider>
    )
    expect(view.match(/rel="icon"/g)).toHaveLength(1)
    expect(view).toContain('<link rel="icon" href="/assets/icon-a1b2.svg"/>')
    expect(view).toContain('<link rel="apple-touch-icon" href="/assets/apple-c3d4.png"/>')
    expect(view).not.toContain("/project/favicon.ico")
  })

  it("keeps the generated touch icon next to a site icon", () => {
    const view = renderToStaticMarkup(
      <ArdoDocumentProvider value={{ ...document, icon: "/assets/icon-a1b2.svg" }}>
        <ArdoRootLayout>
          <p>Branded site</p>
        </ArdoRootLayout>
      </ArdoDocumentProvider>
    )
    expect(view).toContain('<link rel="apple-touch-icon" href="/project/apple-touch-icon.png"/>')
  })

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
