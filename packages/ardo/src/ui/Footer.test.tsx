import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoProvider, ArdoSiteConfigProvider } from "../runtime/hooks"
import { ArdoFooter } from "./Footer"
import { resolveArdoLabels } from "./labels"

function renderFooter(
  node: React.ReactNode,
  options: {
    lang?: string
    labels?: Parameters<typeof resolveArdoLabels>[0]
  } = {}
): string {
  const labels = options.labels === undefined ? undefined : resolveArdoLabels(options.labels)
  const content = (
    <ArdoProvider config={{ title: "Docs", lang: options.lang }} sidebar={[]}>
      {node}
    </ArdoProvider>
  )
  const wrapped =
    labels === undefined ? (
      content
    ) : (
      <ArdoSiteConfigProvider value={{ labels }}>{content}</ArdoSiteConfigProvider>
    )
  return renderToStaticMarkup(wrapped)
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

  it("formats build dates with the site locale and keeps invalid dates readable", () => {
    const date = "2026-01-05T12:00:00.000Z"
    const expected = new Date(date).toLocaleDateString("de-DE", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    const view = renderFooter(<ArdoFooter ardoLink={false} buildTime={date} />, {
      lang: "de-DE",
    })
    const utils = renderFooter(<ArdoFooter ardoLink={false} buildTime="not-a-date" />, {
      lang: "de-DE",
    })

    expect(view).toContain(`Built on ${expected}`)
    expect(utils).toContain("Built on not-a-date")
  })

  it("uses configured footer labels", () => {
    const view = renderFooter(<ArdoFooter buildTime="2026-01-05T12:00:00.000Z" />, {
      labels: {
        footer: {
          builtOn: "Erstellt am",
          builtWithArdo: "Erstellt mit Ardo",
        },
      },
    })

    expect(view).toContain("Erstellt am")
    expect(view).toContain("Erstellt mit Ardo")
  })
})
