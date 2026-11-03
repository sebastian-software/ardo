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

function renderArticle({
  frontmatter = {},
  markdownPath,
  pageActions,
  siteConfig = {},
}: {
  frontmatter?: Record<string, unknown>
  markdownPath?: string
  pageActions?: boolean
  siteConfig?: Parameters<typeof ArdoSiteConfigProvider>[0]["value"]
}) {
  return renderToStaticMarkup(
    <ArdoPageProvider source={{ relativePath: "guide/start.mdx", lastUpdated: 0 }}>
      <ArdoProvider config={{ title: "Docs", lang: "en" }} sidebar={[]}>
        <ArdoSiteConfigProvider value={siteConfig}>
          <ArdoPageDataProvider
            frontmatter={{ title: "Start", ...frontmatter }}
            markdownPath={markdownPath}
            toc={[]}
          >
            <ArdoDocContent pageActions={pageActions}>
              <p>Welcome.</p>
            </ArdoDocContent>
          </ArdoPageDataProvider>
        </ArdoSiteConfigProvider>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

describe("page actions under the title", () => {
  it("links to the page's Markdown file and renders Copy page in the heading", () => {
    const html = renderArticle({ markdownPath: "/docs/guide/start.md" })
    expect(html).toContain('href="/docs/guide/start.md"')
    expect(html).toContain("View as Markdown")
    expect(html).toContain("Copy page")
    // Both actions sit in the article heading, before the body.
    expect(html.indexOf("View as Markdown")).toBeLessThan(html.indexOf("ardo-content-body"))
    expect(html.indexOf("Copy page")).toBeLessThan(html.indexOf("ardo-content-body"))
  })

  it("renders no actions for a page without a Markdown file", () => {
    const html = renderArticle({})
    expect(html).not.toContain("View as Markdown")
    expect(html).not.toContain("Copy page")
  })

  it("hides the actions when ArdoDocContent sets pageActions to false", () => {
    const html = renderArticle({ markdownPath: "/docs/guide/start.md", pageActions: false })
    expect(html).not.toContain("View as Markdown")
  })

  it("hides the actions when ArdoRoot sets pageActions to false", () => {
    const html = renderArticle({
      markdownPath: "/docs/guide/start.md",
      siteConfig: { pageActions: false },
    })
    expect(html).not.toContain("View as Markdown")
  })

  it("lets a page's pageActions frontmatter hide its own actions", () => {
    const html = renderArticle({
      frontmatter: { pageActions: false },
      markdownPath: "/docs/guide/start.md",
    })
    expect(html).not.toContain("View as Markdown")
  })

  it("keeps the actions when only other page settings are turned off", () => {
    const html = renderArticle({
      frontmatter: { editLink: false, lastUpdated: false },
      markdownPath: "/docs/guide/start.md",
    })
    expect(html).toContain("View as Markdown")
  })
})

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
