import { describe, expect, it } from "vitest"

import { findLocalizedRouteDiagnostics, formatLocalizedRouteDiagnostics } from "./i18n-routes"

const config = {
  i18n: {
    defaultLocale: "en",
    locales: [{ id: "en" }, { id: "de" }],
  },
}

function route(routePath: string, sourceLocaleId?: string) {
  return { routePath, ...(sourceLocaleId == null ? {} : { sourceLocaleId }) }
}

describe("findLocalizedRouteDiagnostics", () => {
  it("accepts matching locale route trees", () => {
    expect(
      findLocalizedRouteDiagnostics(
        [route("/guide/start", "en"), route("/guide/start", "de")],
        config
      )
    ).toStrictEqual([])
  })

  it("reports unlocalized pages and missing static translations", () => {
    const diagnostics = findLocalizedRouteDiagnostics(
      [route("/guide/start", "en"), route("/guide/api", "de"), route("/news")],
      config
    )

    expect(diagnostics).toStrictEqual([
      { localeId: "en", routePath: "/guide/api", type: "missing" },
      { localeId: "de", routePath: "/guide/start", type: "missing" },
      { routePath: "/news", type: "unlocalized" },
    ])
    expect(formatLocalizedRouteDiagnostics(diagnostics)).toContain(
      "/guide/start: missing de translation"
    )
  })

  it("does nothing when i18n is disabled", () => {
    expect(findLocalizedRouteDiagnostics([route("/guide/start")], { i18n: false })).toStrictEqual(
      []
    )
  })
})
