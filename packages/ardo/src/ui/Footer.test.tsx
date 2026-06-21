import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoFooter } from "./Footer"

function renderFooter(node: React.ReactNode): string {
  return renderToStaticMarkup(
    <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
      {node}
    </ArdoProvider>
  )
}

describe("ArdoFooter", () => {
  it("escapes plain string footer content", () => {
    const view = renderFooter(
      <ArdoFooter
        ardoLink={false}
        message="<strong>Released</strong>"
        copyright="<script>alert('x')</script>"
      />
    )

    expect(view).toContain("&lt;strong&gt;Released&lt;/strong&gt;")
    expect(view).toContain("&lt;script&gt;alert(&#x27;x&#x27;)&lt;/script&gt;")
    expect(view).not.toContain("<strong>Released</strong>")
    expect(view).not.toContain("<script>")
  })

  it("renders trusted HTML only through explicit trusted props", () => {
    const view = renderFooter(
      <ArdoFooter
        ardoLink={false}
        trustedMessageHtml="<strong>Released</strong>"
        trustedCopyrightHtml="Copyright <em>2026</em>"
      />
    )

    expect(view).toContain("<strong>Released</strong>")
    expect(view).toContain("Copyright <em>2026</em>")
  })
})
