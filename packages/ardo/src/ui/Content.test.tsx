import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { ArdoPageDataProvider, ArdoProvider } from "../runtime/hooks"
import { ArdoContent } from "./Content"

function renderContent(lede: boolean): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
        <ArdoPageDataProvider
          frontmatter={{
            description: "Install the package and import the provider.",
            lede,
            title: "Guide",
          }}
          toc={[]}
        >
          <ArdoContent>
            <p>Install the package and import the provider.</p>
          </ArdoContent>
        </ArdoPageDataProvider>
      </ArdoProvider>
    </MemoryRouter>
  )
}

describe("ArdoContent", () => {
  it("renders frontmatter descriptions as a visible lede by default", () => {
    const view = renderContent(true)

    expect(view.match(/Install the package and import the provider\./g)).toHaveLength(2)
  })

  it("allows frontmatter descriptions to be metadata only", () => {
    const view = renderContent(false)

    expect(view.match(/Install the package and import the provider\./g)).toHaveLength(1)
  })
})
