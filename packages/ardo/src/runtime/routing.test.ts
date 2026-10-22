import { describe, expect, it, vi } from "vitest"

import { isDynamicRoute, matchRoute, resolvePage, type ArdoRouteEntry } from "./routing"

const Page = () => null
const route: ArdoRouteEntry = {
  id: "app/routes/guide/intro.tsx",
  path: "/guide/intro",
  load: async () => ({ default: Page }),
}

describe("route resolution", () => {
  it("rejects a matched route without a default page component", async () => {
    await expect(
      resolvePage({
        base: "/",
        path: route.path,
        root: {},
        route: { ...route, load: async () => ({}) },
      })
    ).rejects.toThrow(
      '[ardo] Route "app/routes/guide/intro.tsx" must export a default page component.'
    )
  })

  it("resolves a valid matched page", async () => {
    const page = await resolvePage({ base: "/v6/", path: route.path, root: {}, route })
    expect(page.component).toBe(Page)
    expect(page.data).toMatchObject({ base: "/v6/", path: route.path, routeId: route.id })
    expect(page.error).toBeUndefined()
  })

  it("retains the not-found response for an unknown URL", async () => {
    const page = await resolvePage({ base: "/", path: "/unknown", root: {}, route: undefined })
    expect(page.data.error).toStrictEqual({ status: 404, message: "No page at /unknown" })
  })

  it("does not load a route when an intentional error is supplied", async () => {
    const load = vi.fn(async () => ({}))
    const page = await resolvePage({
      base: "/",
      path: route.path,
      root: {},
      route: { ...route, load },
      error: { status: 404 },
    })
    expect(page.error).toStrictEqual({ status: 404 })
    expect(load).not.toHaveBeenCalled()
  })

  it("matches dynamic routes while preferring an exact static route", () => {
    const dynamic = { ...route, id: "app/routes/guide/$slug.tsx", path: "/guide/:slug" }
    expect(matchRoute([dynamic, route], "/guide/intro/")).toBe(route)
    expect(matchRoute([dynamic, route], "/guide/other")).toBe(dynamic)
    expect(isDynamicRoute(dynamic)).toBe(true)
    expect(isDynamicRoute(route)).toBe(false)
  })
})
