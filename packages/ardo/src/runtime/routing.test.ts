import { describe, expect, it, vi } from "vitest"

import {
  isDynamicRoute,
  loadPageModule,
  matchRoute,
  resolvePage,
  type ArdoRouteEntry,
} from "./routing"

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

const titleRoute: ArdoRouteEntry = { ...route, id: "app/routes/home.tsx", path: "/" }

describe("resolvePage", () => {
  it("gives a page the site title unless the page or root set one", async () => {
    const untitled = await resolvePage({
      base: "/",
      path: "/",
      root: {},
      route: titleRoute,
      siteTitle: "Docs",
    })
    const titled = await resolvePage({
      base: "/",
      path: "/",
      root: { meta: () => [{ title: "Home" }] },
      route: titleRoute,
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
      route: titleRoute,
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

describe("client page loading", () => {
  const routeId = "app/routes/guide/intro.mdx"
  const pageModule = { default: Page }

  function loaders(entries: Record<string, () => Promise<{ default?: typeof Page }>> = {}) {
    const importModule = vi.fn(async (_url: string) => pageModule)
    const importLoaders = vi.fn(async () => entries)
    return {
      baseURI: "https://docs.example.test/v6/guide/intro/",
      events: new EventTarget(),
      importModule,
      importLoaders,
    }
  }

  /** Options whose page chunk import fails, recording every `vite:preloadError` event. */
  function failingImport(error: Error, listener: (event: Event) => void) {
    const options = loaders()
    options.importModule.mockRejectedValue(error)
    const events: Array<Event & { payload?: unknown }> = []
    options.events.addEventListener("vite:preloadError", (event) => {
      events.push(event)
      listener(event)
    })
    return { events, options }
  }

  it("imports the page chunk the server named, resolved like its modulepreload", async () => {
    const options = loaders()
    await expect(
      loadPageModule({ module: "/v6/assets/intro-abc.js", routeId }, options)
    ).resolves.toBe(pageModule)
    await loadPageModule({ module: "../../assets/intro-abc.js", routeId }, options)
    expect(options.importModule.mock.calls).toStrictEqual([
      ["https://docs.example.test/v6/assets/intro-abc.js"],
      ["https://docs.example.test/v6/assets/intro-abc.js"],
    ])
    expect(options.importLoaders).not.toHaveBeenCalled()
  })

  it("reports a failed page chunk import as vite:preloadError and rethrows it", async () => {
    const error = new Error("Failed to fetch dynamically imported module")
    const { events, options } = failingImport(error, vi.fn())
    await expect(
      loadPageModule({ module: "/v6/assets/intro-abc.js", routeId }, options)
    ).rejects.toBe(error)
    expect(events).toHaveLength(1)
    expect(events[0]?.cancelable).toBe(true)
    expect(events[0]?.payload).toBe(error)
    expect(options.importLoaders).not.toHaveBeenCalled()
  })

  it("leaves a prevented vite:preloadError to its listener and does not throw", async () => {
    const error = new Error("Failed to fetch dynamically imported module")
    const { events, options } = failingImport(error, (event) => {
      event.preventDefault()
    })
    const pending = Symbol("pending")
    const result = await Promise.race([
      loadPageModule({ module: "/v6/assets/intro-abc.js", routeId }, options),
      new Promise<typeof pending>((resolve) => {
        setTimeout(() => {
          resolve(pending)
        }, 20)
      }),
    ])
    // The listener recovers, for example by reloading; hydration does not continue.
    expect(result).toBe(pending)
    expect(events.map((event) => event.payload)).toStrictEqual([error])
    expect(options.importLoaders).not.toHaveBeenCalled()
  })

  it.each([undefined, "", 42, { file: "x.js" }])(
    "falls back to the loader table when the module URL is %j",
    async (module) => {
      const load = vi.fn(async () => pageModule)
      const options = loaders({ [routeId]: load })
      await expect(loadPageModule({ module, routeId }, options)).resolves.toBe(pageModule)
      expect(load).toHaveBeenCalledOnce()
      expect(options.importModule).not.toHaveBeenCalled()
    }
  )

  it("names the route when the loader table has no page for it", async () => {
    await expect(loadPageModule({ routeId: "constructor" }, loaders())).rejects.toThrow(
      '[ardo] The client has no page module for route "constructor".'
    )
  })

  it("resolves a page from a loader and the serialized source alone", async () => {
    const source = { relativePath: "guide/intro.mdx", lastUpdated: 1 }
    const page = await resolvePage({
      base: "/v6/",
      path: "/guide/intro",
      root: {},
      route: { id: routeId, load: async () => pageModule },
      source,
    })
    expect(page.component).toBe(Page)
    expect(page.source).toStrictEqual(source)
    expect(page.data).toStrictEqual({ base: "/v6/", path: "/guide/intro", routeId, source })
  })
})
