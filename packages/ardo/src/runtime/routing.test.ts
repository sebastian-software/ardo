import { describe, expect, it } from "vitest"

import type { ArdoRouteEntry } from "./routing"

import { resolvePage } from "./routing"

function Page() {
  return null
}

const route: ArdoRouteEntry = {
  id: "app/routes/home.tsx",
  path: "/",
  load: async () => ({ default: Page }),
}

describe("resolvePage", () => {
  it("gives a page the site title unless the page or root set one", async () => {
    const untitled = await resolvePage({ base: "/", path: "/", root: {}, route, siteTitle: "Docs" })
    const titled = await resolvePage({
      base: "/",
      path: "/",
      root: { meta: () => [{ title: "Home" }] },
      route,
      siteTitle: "Docs",
    })

    expect(untitled.meta).toStrictEqual([{ title: "Docs" }])
    expect(titled.meta).toStrictEqual([{ title: "Home" }])
  })

  it("keeps other meta and adds the site title after it", async () => {
    const page = await resolvePage({
      base: "/",
      path: "/",
      root: { meta: () => [{ name: "description", content: "Guides" }] },
      route,
      siteTitle: "Docs",
    })

    expect(page.meta).toStrictEqual([{ name: "description", content: "Guides" }, { title: "Docs" }])
  })

  it("gives the missing page the site title", async () => {
    const page = await resolvePage({
      base: "/",
      path: "/missing",
      root: {},
      route: undefined,
      siteTitle: "Docs",
    })

    expect(page.error).toStrictEqual({ status: 404, message: "No page at /missing" })
    expect(page.meta).toStrictEqual([{ title: "Docs" }])
  })
})
