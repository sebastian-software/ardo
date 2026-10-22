import { describe, expect, it } from "vitest"

import { toPagePath } from "./dev-render"

const routes = new Set(["/guide/release-6.0", "/guide/café-6.0", "/guide/index.html"])
const isPage = (pathname: string) => routes.has(pathname.replace(/\/+$/u, ""))
const request = (url: string) => ({ url, headers: { accept: "text/html" }, method: "GET" })

describe("dotted page requests", () => {
  it.each([
    ["/project/guide/release-6.0", "/guide/release-6.0"],
    ["/project/guide/release-6.0/", "/guide/release-6.0/"],
    ["/project/guide/caf%C3%A9-6.0", "/guide/café-6.0"],
    ["/project/guide/index.html", "/guide/index.html"],
    ["/project/guide/index.html/", "/guide/index.html/"],
  ])("recognizes the authored route %s", (url, expected) => {
    expect(toPagePath(request(url), "/project/", isPage)).toBe(expected)
  })

  it("keeps generated index aliases and leaves unrelated files to Vite", () => {
    expect(toPagePath(request("/project/guide/other/index.html"), "/project/", isPage)).toBe(
      "/guide/other"
    )
    expect(toPagePath(request("/project/app.js"), "/project/", isPage)).toBeUndefined()
  })
})
