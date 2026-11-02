import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoPageDataProvider, ArdoProvider, ArdoSiteConfigProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoDocContent } from "./DocPage"

function renderPage(outline = true) {
  return renderToStaticMarkup(
    <ArdoPageProvider
      source={{ relativePath: "guide/setup guide.mdx", lastUpdated: Date.UTC(2026, 0, 15) }}
    >
      <ArdoProvider config={{ title: "Docs", lang: "en" }} sidebar={[]}>
        <ArdoSiteConfigProvider
          value={{
            editLink: { pattern: "https://github.com/org/repo/edit/main/docs/:path" },
            lastUpdated: { enabled: true },
          }}
        >
          <ArdoPageDataProvider
            frontmatter={{ title: "Setup", outline }}
            toc={[{ id: "install", level: 2, text: "Install" }]}
          >
            <ArdoDocContent>
              <h2 id="install">Install</h2>
            </ArdoDocContent>
          </ArdoPageDataProvider>
        </ArdoSiteConfigProvider>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

function renderWidth(contentWidth?: "reading" | "page") {
  return renderToStaticMarkup(
    <ArdoPageProvider handle={{ contentWidth: "page" }}>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
        <ArdoDocContent contentWidth={contentWidth}>
          <p>Reference</p>
        </ArdoDocContent>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

describe("documentation page source metadata and compact outline", () => {
  it("lets explicit composition override a route's content width", () => {
    expect(renderWidth()).toContain('data-content-width="page"')
    expect(renderWidth("reading")).toContain('data-content-width="reading"')
  })
  it("keeps the real source path and a deterministic updated date in rail and footer", () => {
    const html = renderPage()
    expect(
      html.match(/https:\/\/github.com\/org\/repo\/edit\/main\/docs\/guide\/setup%20guide.mdx/g)
    ).toHaveLength(2)
    expect(html.match(/January 15, 2026/g)).toHaveLength(2)
    expect(html).toContain('<details class="ardo-page-outline')
    expect(html).toContain('href="#install"')
  })

  it("respects outline opt-out for both compact and desktop navigation", () => {
    const html = renderPage(false)
    expect(html).not.toContain("<details")
    expect(html).not.toContain('href="#install"')
    expect(html).toContain("Edit this page")
  })
})
