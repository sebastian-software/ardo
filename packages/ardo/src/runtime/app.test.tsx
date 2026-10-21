import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { ArdoPageError } from "./page-context"
import type { ArdoRootModule } from "./routing"

import { ArdoPageTree } from "./app"
import { ArdoOutlet } from "./page"

const root: ArdoRootModule = {
  default: () => (
    <>
      <header>Site header</header>
      <main>
        <ArdoOutlet />
      </main>
    </>
  ),
}

function renderError(error: ArdoPageError): string {
  const page = {
    component: () => <p>Error page</p>,
    data: { base: "/", path: "/missing" },
    error,
    meta: [],
  }
  return renderToStaticMarkup(<ArdoPageTree page={page} root={root} />)
}

describe("ArdoPageTree", () => {
  it("renders a missing page inside the site root", () => {
    expect(renderError({ status: 404 })).toBe(
      "<header>Site header</header><main><p>Error page</p></main>"
    )
  })

  it("replaces the site root for a render error", () => {
    expect(renderError(new Error("Broken chrome"))).toBe("<p>Error page</p>")
    expect(renderError({ status: 500 })).toBe("<p>Error page</p>")
  })
})
