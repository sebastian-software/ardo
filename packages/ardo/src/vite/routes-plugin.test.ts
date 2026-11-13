import type { ViteDevServer } from "vite"

import { EventEmitter } from "node:events"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  ardoRoutesPlugin,
  createClientRoutesModule,
  createPageLoadersModule,
  createRoutesModule,
} from "./routes-plugin"

let root: string
let routesDir: string

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-routes-plugin-"))
  routesDir = path.join(root, "app/routes")
  await fs.mkdir(path.join(routesDir, "guide"), { recursive: true })
  await fs.writeFile(path.join(routesDir, "home.tsx"), "export default function Home() {}")
  await fs.writeFile(path.join(routesDir, "guide/intro.mdx"), "# Intro")
  await fs.writeFile(path.join(routesDir, "guide/release-6.0.mdx"), "# Release")
})

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true })
})

/** Call a plugin hook, which the routes plugin declares as a plain function. */
function call<T>(hook: unknown, ...args: unknown[]): T {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return (hook as (...values: unknown[]) => T).call({}, ...args)
}

/** Load a virtual module from the plugin as the named Vite environment does. */
function load(plugin: ReturnType<typeof ardoRoutesPlugin>, id: string, environment = "client") {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const hook = plugin.load as (this: unknown, id: string) => string
  return hook.call({ environment: { name: environment } }, `\0${id}`)
}

/** A routes plugin configured for the temporary project. */
function createPlugin() {
  const plugin = ardoRoutesPlugin()
  call(plugin.configResolved, { root })
  return plugin
}

/** Every path in the generated server route table, in order. */
function readTablePaths(source: string): unknown[] {
  return [...source.matchAll(/ path: ("[^"]*")/gu)].map(([, value]) => JSON.parse(value ?? ""))
}

/** The value a generated module exports as `name`, which is a JSON literal. */
function readExport(source: string, name: string): unknown {
  const match = new RegExp(String.raw`^export const ${name} = (.*)$`, "mu").exec(source)
  return JSON.parse(match?.[1] ?? "null")
}

describe("client route modules", () => {
  it("exports the root module before the styles and every logical path, nothing else", async () => {
    await fs.writeFile(path.join(root, "app/root.tsx"), "export default function Root() {}")
    const source = createClientRoutesModule({ routesDir })

    const rootImport = `import * as rootModule from ${JSON.stringify(path.join(root, "app/root.tsx"))}`
    expect(source).toBe(
      `${rootImport}\nimport "ardo/ui/styles.css"\nexport { rootModule }\nexport const paths = ["/","/guide/intro","/guide/release-6.0"]\n`
    )
    expect(source).not.toContain("load")
    expect(source).not.toContain("app/routes")
  })

  it("falls back to ArdoRoot without a root module", () => {
    const source = createClientRoutesModule({ routesDir })
    expect(
      source.startsWith(
        'import { ArdoRoot } from "ardo/ui"\nconst rootModule = { default: ArdoRoot }\nimport "ardo/ui/styles.css"\n'
      )
    ).toBe(true)
  })

  it("lists the same logical paths, in the same order, as the server route table", () => {
    const table = createRoutesModule({ root, routesDir })
    expect(readExport(createClientRoutesModule({ routesDir }), "paths")).toStrictEqual(
      readTablePaths(table)
    )
    // The prelude is shared: both modules import the root and styles identically.
    expect(createClientRoutesModule({ routesDir }).split("export")[0]).toBe(
      table.split("export")[0]
    )
  })

  it("maps every route id to a lazy import of its page", () => {
    expect(createPageLoadersModule({ root, routesDir })).toBe(
      [
        "export default {",
        `  "app/routes/home.tsx": () => import(${JSON.stringify(path.join(routesDir, "home.tsx"))}),`,
        `  "app/routes/guide/intro.mdx": () => import(${JSON.stringify(path.join(routesDir, "guide/intro.mdx"))}),`,
        `  "app/routes/guide/release-6.0.mdx": () => import(${JSON.stringify(path.join(routesDir, "guide/release-6.0.mdx"))}),`,
        "}",
        "",
      ].join("\n")
    )
  })

  it("serves both modules from the plugin", async () => {
    const plugin = ardoRoutesPlugin()
    call(plugin.configResolved, { root })
    for (const id of ["virtual:ardo/client-routes", "virtual:ardo/page-loaders"]) {
      const resolved = call<string>(plugin.resolveId, id)
      expect(resolved).toBe(`\0${id}`)
      expect(call(plugin.load, resolved)).toContain("/guide/intro")
    }
  })

  it("orders the route table with a fixed locale, independent of the build machine", () => {
    const compare = vi.spyOn(String.prototype, "localeCompare")
    createRoutesModule({ root, routesDir })
    expect(compare).toHaveBeenCalled()
    for (const args of compare.mock.calls) expect(args[1]).toBe("en")
    compare.mockRestore()
  })
})

describe("the shared route scan", () => {
  const routeIds = [
    "virtual:ardo/routes",
    "virtual:ardo/client-routes",
    "virtual:ardo/page-loaders",
  ]

  it("builds all route modules from one scan, so they list the same routes", async () => {
    const plugin = createPlugin()
    expect(load(plugin, "virtual:ardo/routes", "ssr")).toContain("/guide/intro")
    // A file that appears between loads, without an invalidation, reaches no module.
    await fs.writeFile(path.join(routesDir, "guide/late.mdx"), "# Late")
    const loads: Array<[string, string]> = [
      ...routeIds.map((id): [string, string] => ["client", id]),
      ["ssr", "virtual:ardo/client-routes"],
      ["ssr", "virtual:ardo/page-loaders"],
    ]
    for (const [environment, id] of loads) {
      const source = load(plugin, id, environment)
      expect(source, `${environment} ${id}`).toContain("guide/intro")
      expect(source, `${environment} ${id}`).not.toContain("guide/late")
    }
  })

  it("rescans when an environment loads a route module again after the graph invalidated it", async () => {
    const plugin = createPlugin()
    expect(load(plugin, "virtual:ardo/client-routes")).not.toContain("/guide/late")
    // Other Ardo plugins regenerate route files and invalidate every Ardo virtual module.
    await fs.writeFile(path.join(routesDir, "guide/late.mdx"), "# Late")
    expect(load(plugin, "virtual:ardo/client-routes")).toContain("/guide/late")
    expect(load(plugin, "virtual:ardo/routes", "ssr")).toContain("/guide/late")
    expect(load(plugin, "virtual:ardo/page-loaders")).toContain("guide/late.mdx")
  })

  it("scans the routes directory of the latest resolved config", async () => {
    const plugin = createPlugin()
    expect(load(plugin, "virtual:ardo/client-routes")).toContain("/guide/intro")
    const other = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-routes-plugin-other-"))
    try {
      await fs.mkdir(path.join(other, "app/routes"), { recursive: true })
      await fs.writeFile(path.join(other, "app/routes/about.mdx"), "# About")
      call(plugin.configResolved, { root: other })
      const source = load(plugin, "virtual:ardo/routes", "ssr")
      expect(source).toContain('"/about"')
      expect(source).not.toContain("/guide/intro")
    } finally {
      await fs.rm(other, { recursive: true, force: true })
    }
  })
})

describe("route changes in development", () => {
  const routeModules = [
    "\0virtual:ardo/routes",
    "\0virtual:ardo/client-routes",
    "\0virtual:ardo/page-loaders",
  ]

  function attachServer() {
    const watcher = Object.assign(new EventEmitter(), { add: vi.fn() })
    const ws = { send: vi.fn() }
    const environments = Object.fromEntries(
      ["client", "ssr"].map((name) => {
        const modules = new Map(routeModules.map((id) => [id, { id }]))
        return [
          name,
          {
            moduleGraph: {
              getModuleById: (id: string) => modules.get(id),
              invalidateModule: vi.fn<(module: { id: string }) => void>(),
            },
          },
        ]
      })
    )
    const plugin = ardoRoutesPlugin()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const configResolved = plugin.configResolved as (config: { root: string }) => void
    configResolved({ root })
    // The plugin reads only the watcher, the transport, and the module graphs.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const server = { watcher, ws, environments } as unknown as ViteDevServer
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const configureServer = plugin.configureServer as (server: ViteDevServer) => void
    configureServer(server)
    return { environments, plugin, watcher, ws }
  }

  it.each([
    ["add", "guide/new.mdx"],
    ["unlink", "guide/intro.mdx"],
    ["add", "../root.tsx"],
    ["unlink", "../root.tsx"],
  ])("invalidates every route module on %s of %s", (event, file) => {
    const { environments, watcher, ws } = attachServer()
    watcher.emit(event, path.join(routesDir, file))
    for (const environment of Object.values(environments)) {
      const invalidated = environment.moduleGraph.invalidateModule.mock.calls.map(
        ([module]) => module.id
      )
      expect(invalidated).toStrictEqual(routeModules)
    }
    expect(ws.send.mock.calls).toStrictEqual([[{ type: "full-reload" }]])
  })

  it("starts a new shared route scan when the routes are invalidated", async () => {
    const { plugin, watcher } = attachServer()
    expect(load(plugin, "virtual:ardo/routes", "ssr")).not.toContain("/guide/new")
    const added = path.join(routesDir, "guide/new.mdx")
    await fs.writeFile(added, "# New")
    watcher.emit("add", added)
    // Modules this environment has not loaded yet come first: only the reset makes them rescan.
    for (const id of [
      "virtual:ardo/page-loaders",
      "virtual:ardo/client-routes",
      "virtual:ardo/routes",
    ])
      expect({ id, source: load(plugin, id, "ssr") }).toStrictEqual({
        id,
        source: expect.stringContaining("guide/new"),
      })
  })

  it("ignores files that are neither routes nor the root module", () => {
    const { environments, watcher, ws } = attachServer()
    watcher.emit("add", path.join(routesDir, "guide/notes.txt"))
    watcher.emit("add", path.join(root, "app/Counter.tsx"))
    for (const environment of Object.values(environments))
      expect(environment.moduleGraph.invalidateModule).not.toHaveBeenCalled()
    expect(ws.send).not.toHaveBeenCalled()
  })
})
