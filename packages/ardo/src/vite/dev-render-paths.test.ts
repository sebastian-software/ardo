import { describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { getDevRedirect, toPagePath } from "./dev-render"

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

describe("locale migration redirects in development", () => {
  const options = {
    title: "Docs",
    base: "/project/",
    i18n: { defaultLocale: "en", redirectUnlocalized: true, locales: [{ id: "en" }, { id: "de" }] },
  }
  it("redirects only existing unprefixed routes inside the deployment base", () => {
    const config = resolveConfig(options, "/site")
    expect(getDevRedirect("/project/guide/start/", config, ["/en/guide/start"])).toBe(
      "/project/en/guide/start/"
    )
    expect(
      getDevRedirect("/project/de/guide/start/", config, ["/en/guide/start", "/de/guide/start"])
    ).toBeUndefined()
    expect(getDevRedirect("/project/de/", config, ["/de", "/en/de"])).toBeUndefined()
    expect(getDevRedirect("/project/guide/missing", config, ["/en/guide/start"])).toBeUndefined()
    expect(getDevRedirect("/outside/guide/start", config, ["/en/guide/start"])).toBeUndefined()
  })
  it("honors an explicit root redirect opt-out during migration", () => {
    const config = resolveConfig(
      {
        ...options,
        versioning: { current: "v6", rootRedirect: false, versions: [{ id: "v6", path: "/v6/" }] },
      },
      "/site"
    )
    expect(getDevRedirect("/project/v6/", config, ["/en"])).toBeUndefined()
  })
})
