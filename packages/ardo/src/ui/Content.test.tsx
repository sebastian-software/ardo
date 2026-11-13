import type { ReactNode } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { ArdoPageProvider } from "../runtime/page"
import { describe, expect, it } from "vitest"

import type { PageData } from "../config/types"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoTrailingSlashContext } from "../runtime/route-paths"
import { ArdoContent } from "./Content"

function renderContent(pageData: PageData, children: ReactNode): string {
  return renderToStaticMarkup(
    <ArdoPageProvider>
      <ArdoProvider config={{ title: "Docs" }} currentPage={pageData} sidebar={[]}>
        <ArdoContent>{children}</ArdoContent>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

function createPageData(frontmatter: PageData["frontmatter"]): PageData {
  return {
    content: "",
    filePath: "",
    frontmatter,
    relativePath: "guide/page.mdx",
    title: frontmatter.title ?? "",
    toc: [],
  }
}

describe("ArdoContent", () => {
  it("renders the frontmatter banner above the page heading and body", () => {
    const view = renderContent(
      createPageData({
        banner: { content: "Read the migration guide.", variant: "warning" },
        title: "Guide",
      }),
      <p>Body text.</p>
    )

    expect(view).toContain("Read the migration guide.")
    expect(view.indexOf("Read the migration guide.")).toBeLessThan(view.indexOf("Guide</h1>"))
    expect(view.indexOf("Read the migration guide.")).toBeLessThan(view.indexOf("Body text."))
  })

  it("does not render duplicate lede text when the first paragraph matches description", () => {
    const view = renderContent(
      createPageData({
        description: "Same introduction text.",
        title: "Guide",
      }),
      <p>Same introduction text.</p>
    )

    expect(view.match(/Same introduction text\./g)).toHaveLength(1)
  })

  it("can keep description metadata out of visible content explicitly", () => {
    const view = renderContent(
      createPageData({
        description: "Metadata-only description.",
        lede: false,
        title: "Guide",
      }),
      <p>Different body text.</p>
    )

    expect(view).not.toContain("Metadata-only description.")
    expect(view).toContain("Different body text.")
  })

  it("renders the lede when the first paragraph is different", () => {
    const view = renderContent(
      createPageData({
        description: "Short page summary.",
        title: "Guide",
      }),
      <p>First body paragraph.</p>
    )

    expect(view).toContain("Short page summary.")
    expect(view).toContain("First body paragraph.")
  })
})

const footerSidebar = [
  { text: "Start", link: "/guide/start" },
  { text: "Page", link: "/guide/page" },
  { text: "Deploy", link: "/guide/deploy" },
]

function renderFooter(frontmatter: PageData["frontmatter"], base = "/"): string {
  return renderToStaticMarkup(
    <ArdoPageProvider base={base} path="/guide/page">
      <ArdoTrailingSlashContext value={false}>
        <ArdoProvider
          config={{ title: "Docs" }}
          currentPage={createPageData(frontmatter)}
          sidebar={footerSidebar}
        >
          <ArdoContent>
            <p>Body</p>
          </ArdoContent>
        </ArdoProvider>
      </ArdoTrailingSlashContext>
    </ArdoPageProvider>
  )
}

/** Text and href of each previous/next link, from the last navigation of the article. */
function footerLinks(view: string): string[] {
  const footer = view.slice(Math.max(0, view.lastIndexOf("<nav")))
  return [
    ...footer.matchAll(/<a [^>]*href="([^"]*)"[^>]*>.*?<span[^>]*>([^<]*)<\/span><\/a>/g),
  ].map(([, href, text]) => `${text} ${href}`)
}

describe("ArdoContent previous and next links", () => {
  it("links the sidebar neighbours by default", () => {
    expect(footerLinks(renderFooter({ title: "Page" }))).toStrictEqual([
      "Start /guide/start",
      "Deploy /guide/deploy",
    ])
  })

  it("hides a side set to false", () => {
    expect(footerLinks(renderFooter({ prev: false, title: "Page" }))).toStrictEqual([
      "Deploy /guide/deploy",
    ])
    expect(renderFooter({ next: false, prev: false, title: "Page" })).not.toContain(
      "Page navigation"
    )
  })

  it("renames the sidebar neighbour with a string", () => {
    expect(footerLinks(renderFooter({ next: "Ship it", title: "Page" }))).toStrictEqual([
      "Start /guide/start",
      "Ship it /guide/deploy",
    ])
  })

  it("resolves an authored link like other page links", () => {
    expect(
      footerLinks(
        renderFooter(
          {
            next: { link: "../reference/api", text: "API" },
            prev: { link: "https://example.com/intro", text: "Intro" },
            title: "Page",
          },
          "/docs/"
        )
      )
    ).toStrictEqual(["Intro https://example.com/intro", "API /docs/reference/api"])
  })
})
