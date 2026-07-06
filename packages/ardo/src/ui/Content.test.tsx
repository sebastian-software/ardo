import type { ReactNode } from "react"

import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import type { PageData } from "../config/types"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoContent } from "./Content"

function renderContent(pageData: PageData, children: ReactNode): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ArdoProvider config={{ title: "Docs" }} currentPage={pageData} sidebar={[]}>
        <ArdoContent>{children}</ArdoContent>
      </ArdoProvider>
    </MemoryRouter>
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
