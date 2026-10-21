import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ArdoActiveLink, ArdoLink, ArdoPageProvider } from "./page"
import { resolveArdoHref, useArdoPath } from "./page-context"

describe("resolveArdoHref", () => {
  const page = { base: "/v6/", path: "/guide/setup" }

  it.each([
    ["/guide/intro", "/v6/guide/intro/"],
    ["/guide/intro/", "/v6/guide/intro/"],
    ["/", "/v6/"],
    ["/guide/intro#install", "/v6/guide/intro/#install"],
    ["/llms.txt", "/v6/llms.txt"],
    ["intro", "/v6/guide/intro/"],
    ["../api", "/v6/api/"],
    ["#top", "#top"],
    ["?q=1", "?q=1"],
    ["https://example.com/x", "https://example.com/x"],
    ["mailto:a@b.c", "mailto:a@b.c"],
    ["//cdn.example.com/x.js", "//cdn.example.com/x.js"],
  ])("resolves %s to %s", (to, href) => {
    expect(resolveArdoHref(to, page)).toBe(href)
  })

  it("works without a base path", () => {
    expect(resolveArdoHref("/guide", { base: "/", path: "/" })).toBe("/guide/")
    expect(resolveArdoHref("/", { base: "/", path: "/guide" })).toBe("/")
  })
})

function Path() {
  return <output>{useArdoPath()}</output>
}

function render(node: React.ReactNode, path = "/guide/setup") {
  return renderToStaticMarkup(
    <ArdoPageProvider base="/docs" path={path}>
      {node}
    </ArdoPageProvider>
  )
}

function onOffClass({ isActive }: { isActive: boolean }) {
  return isActive ? "on" : "off"
}

describe("page context and links", () => {
  it("exposes the current path and prefixes internal links", () => {
    expect(render(<Path />)).toBe("<output>/guide/setup</output>")
    expect(render(<ArdoLink to="/api">API</ArdoLink>)).toBe('<a href="/docs/api/">API</a>')
  })

  it("marks the current page and its ancestors as active", () => {
    expect(render(<ArdoActiveLink to="/guide/setup">x</ArdoActiveLink>)).toBe(
      '<a class="active" aria-current="page" href="/docs/guide/setup/">x</a>'
    )
    expect(
      render(
        <ArdoActiveLink to="/guide" className="link">
          x
        </ArdoActiveLink>
      )
    ).toBe('<a class="link active" aria-current="page" href="/docs/guide/">x</a>')
    expect(
      render(
        <ArdoActiveLink to="/guide" end>
          x
        </ArdoActiveLink>
      )
    ).toBe('<a href="/docs/guide/">x</a>')
    expect(render(<ArdoActiveLink to="/">home</ArdoActiveLink>)).toBe('<a href="/docs/">home</a>')
    expect(
      render(
        <ArdoActiveLink to="/api" className={onOffClass}>
          x
        </ArdoActiveLink>
      )
    ).toBe('<a class="off" href="/docs/api/">x</a>')
  })
})
