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

  it("serves pages whose segments start with @ or __, but not Vite's own requests", () => {
    const pages = new Set(["/api/@scope/pkg", "/api/__init__", "/@scope"])
    const isApiPage = (pathname: string) => pages.has(pathname.replace(/\/+$/u, ""))
    expect(toPagePath(request("/project/api/@scope/pkg"), "/project/", isApiPage)).toBe(
      "/api/@scope/pkg"
    )
    expect(toPagePath(request("/project/api/__init__/"), "/project/", isApiPage)).toBe(
      "/api/__init__/"
    )
    expect(toPagePath(request("/project/@scope"), "/project/", isApiPage)).toBe("/@scope")
    for (const url of [
      "/project/@vite/client",
      "/project/@id/__x00__virtual:ardo/entry-client",
      "/project/@fs/Users/me/site/app/root.tsx",
      "/project/@react-refresh",
      "/project/__open-in-editor",
      "/project/api/@missing",
    ]) {
      expect(toPagePath(request(url), "/project/", isApiPage)).toBeUndefined()
    }
  })

  it("keeps generated index aliases and leaves unrelated files to Vite", () => {
    expect(toPagePath(request("/project/guide/other/index.html"), "/project/", isPage)).toBe(
      "/guide/other"
    )
    expect(toPagePath(request("/project/app.js"), "/project/", isPage)).toBeUndefined()
  })
})

describe("configured redirects in development", () => {
  it("matches each redirect where the build serves it, below the base", () => {
    const config = resolveConfig(
      {
        title: "Docs",
        base: "/docs/",
        redirects: [
          { from: "/old", to: "/docs/new" },
          { from: "/docs/legacy/", to: "/docs/new" },
        ],
      },
      "/site"
    )
    expect(getDevRedirect("/docs/old", config, [])).toBe("/docs/new")
    expect(getDevRedirect("/docs/old/", config, [])).toBe("/docs/new")
    expect(getDevRedirect("/docs/legacy", config, [])).toBe("/docs/new")
    expect(getDevRedirect("/old", config, [])).toBeUndefined()
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

  it("migrates documentation and site URLs using their own version scope", () => {
    const config = resolveConfig(
      {
        ...options,
        versioning: {
          current: "v6",
          versions: [{ id: "v6", path: "/v6/" }],
          directories: ["guide"],
        },
      },
      "/site"
    )
    const localizedRoutes = ["/en/guide/start", "/de/guide/start", "/en/news/release"]
    expect(getDevRedirect("/project/v6/guide/start/", config, localizedRoutes)).toBe(
      "/project/v6/en/guide/start/"
    )
    expect(getDevRedirect("/project/news/release/", config, localizedRoutes)).toBe(
      "/project/en/news/release/"
    )
    expect(getDevRedirect("/project/v6/de/guide/start/", config, localizedRoutes)).toBeUndefined()
    expect(getDevRedirect("/project/guide/start/", config, localizedRoutes)).toBeUndefined()
    expect(getDevRedirect("/project/v6/guide/missing/", config, localizedRoutes)).toBeUndefined()
  })
})
