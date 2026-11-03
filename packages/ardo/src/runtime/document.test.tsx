import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoDocumentProvider, ArdoHead } from "./document"
import { serializeJsonLd } from "./json-ld"
import type { ArdoMetaDescriptor } from "./page-context"

function renderHead(meta: ArdoMetaDescriptor[]): string {
  return renderToStaticMarkup(
    <ArdoDocumentProvider value={{ meta, stylesheets: [], modulePreloads: [] }}>
      <ArdoHead />
    </ArdoDocumentProvider>
  )
}

describe("ArdoHead JSON-LD", () => {
  it("renders the structured data as a ld+json script", () => {
    const html = renderHead([{ "script:ld+json": { "@type": "TechArticle", headline: "Upgrade" } }])

    expect(html).toBe(
      '<script type="application/ld+json">{"@type":"TechArticle","headline":"Upgrade"}</script>'
    )
  })

  it("escapes a title containing </script> so it cannot close the element", () => {
    const data = { "@type": "TechArticle", headline: "</script><script>alert(1)</script>" }
    const html = renderHead([{ "script:ld+json": data }])

    expect(html).not.toContain("</script><script>")
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/u.exec(html)?.[1]
    expect(JSON.parse(json ?? "null")).toStrictEqual(data)
  })
})

describe("ArdoHead navigation", () => {
  it("renders the view transition style and the speculation rules", () => {
    const html = renderToStaticMarkup(
      <ArdoDocumentProvider
        value={{
          meta: [],
          stylesheets: [],
          modulePreloads: [],
          navigation: {
            viewTransitionCss: "@view-transition{navigation:auto}",
            speculationRules: { prefetch: [{ where: { selector_matches: "a[href^='/']" } }] },
          },
        }}
      >
        <ArdoHead />
      </ArdoDocumentProvider>
    )

    expect(html).toBe(
      '<style>@view-transition{navigation:auto}</style><script type="speculationrules">{"prefetch":[{"where":{"selector_matches":"a[href^=\'/\']"}}]}</script>'
    )
  })

  it("renders neither without the navigation option", () => {
    expect(renderHead([])).toBe("")
  })
})

describe("serializeJsonLd", () => {
  it("escapes HTML-sensitive and line separator characters as JSON unicode escapes", () => {
    // U+2028 and U+2029 as decimal code units: 8232 and 8233.
    const separators = String.fromCharCode(8232) + String.fromCharCode(8233)

    expect(serializeJsonLd({ text: `<&>${separators}` })).toBe(
      '{"text":"\\u003c\\u0026\\u003e\\u2028\\u2029"}'
    )
  })
})
