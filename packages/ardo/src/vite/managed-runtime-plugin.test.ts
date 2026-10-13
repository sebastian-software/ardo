import type { UserConfig, ViteDevServer } from "vite"

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { createServer } from "vite"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  findArdoDependencyPackageRoot,
  findArdoPackageRoot,
  findManagedRuntimePackageRoot,
  findOptimizedDependencySource,
  getManagedRuntimePackageNames,
  MANAGED_RUNTIME_SOURCE_META_KEY,
} from "./managed-runtime"
import { createManagedRuntimePlugin } from "./managed-runtime-plugin"
import { createProjectBoundaryPlugin } from "./project-boundary-plugin"

const ardoRoot = findArdoPackageRoot()
let parent: string
let root: string
const servers: ViteDevServer[] = []
let appReactRoot: string

beforeEach(() => {
  parent = mkdtempSync(path.join(os.tmpdir(), "ardo-managed-runtime-plugin-"))
  root = writePackage("docs", { name: "docs", type: "module" })
  appReactRoot = writePackage("docs/node_modules/react", {
    name: "react",
    version: "20.0.0",
    type: "module",
    exports: { ".": "./index.js", "./jsx-runtime": "./jsx-runtime.js" },
  })
  writeFileSync(path.join(appReactRoot, "jsx-runtime.js"), "export const jsx = () => null")
  writePackage("node_modules/ancestor-only", {
    name: "ancestor-only",
    type: "module",
  })
  mkdirSync(path.join(root, "node_modules"), { recursive: true })
  symlinkSync(ardoRoot, path.join(root, "node_modules/ardo"), "dir")
})

afterEach(async () => {
  await Promise.all(servers.splice(0).map(async (server) => server.close()))
  rmSync(parent, { recursive: true, force: true })
})

describe("Ardo managed runtime resolution", () => {
  it("uses Ardo's React when the app has a conflicting React installation", async () => {
    const server = await startManagedServer()
    expect(server.config.resolve.dedupe).toStrictEqual([])
    const resolved = await server.environments.client.pluginContainer.resolveId(
      "react/jsx-runtime",
      path.join(root, "app/route.jsx")
    )
    const expectedRoot = findManagedRuntimePackageRoot(ardoRoot, "react")

    expect(resolved).not.toBeNull()
    const sourcePath = findOptimizedDependencySource(resolved!.id, server.environments.client)
    expect(sourcePath).toBe(realpathSync(path.join(expectedRoot!, "jsx-runtime.js")))
    expect(resolved!.id).not.toContain(appReactRoot)
  })

  it("includes managed browser runtime entries in Vite's optimizer", async () => {
    const server = await startManagedServer(
      {
        optimizeDeps: {
          include: ["existing-dependency"],
          exclude: ["react", "minisearch", "@base-ui/react", "other-package"],
        },
      },
      false
    )

    expect(server.config.optimizeDeps.include).toStrictEqual(
      expect.arrayContaining([
        "existing-dependency",
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/client",
        "react-dom/static",
        "react-router",
        "react-router/dom",
        "lucide-react",
        "ardo > @base-ui/react/accordion",
        "ardo > @vanilla-extract/recipes/createRuntimeFn",
        "ardo > minisearch",
      ])
    )
    expect(server.config.optimizeDeps.exclude).toStrictEqual(["other-package", "ardo"])
    expect(server.config.environments.ssr.optimizeDeps.include).toStrictEqual(
      expect.arrayContaining([
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/server",
        "react-dom/static",
        "react-router",
        "lucide-react",
        "ardo > @base-ui/react/accordion",
        "ardo > @vanilla-extract/recipes/createRuntimeFn",
        "ardo > minisearch",
      ])
    )
    expect(server.config.environments.ssr.optimizeDeps.exclude).toContain("ardo")
  })

  it("keeps browser and SSR conditional exports inside the same Ardo package", async () => {
    const server = await startManagedServer({}, false)
    const importer = path.join(root, "app/route.jsx")
    const [client, ssr] = await Promise.all([
      server.environments.client.pluginContainer.resolveId("react-dom/server", importer),
      server.environments.ssr.pluginContainer.resolveId("react-dom/server", importer),
    ])
    const expectedRoot = findManagedRuntimePackageRoot(ardoRoot, "react-dom")

    expect(client).not.toBeNull()
    expect(ssr).not.toBeNull()
    const clientPath =
      managedSourcePath(client!.meta?.[MANAGED_RUNTIME_SOURCE_META_KEY], "react-dom") ??
      findOptimizedDependencySource(client!.id, server.environments.client)
    const ssrPath =
      managedSourcePath(ssr!.meta?.[MANAGED_RUNTIME_SOURCE_META_KEY], "react-dom") ??
      findOptimizedDependencySource(ssr!.id, server.environments.ssr)
    expect(clientPath).toBeDefined()
    expect(ssrPath).toBeDefined()
    expect(clientPath).toContain(realpathSync(expectedRoot!))
    expect(ssrPath).toContain(realpathSync(expectedRoot!))
    expect(path.basename(clientPath!)).toBe("server.browser.js")
    expect(path.basename(ssrPath!)).toBe("server.node.js")
  })

  it("lets Vite prebundle Ardo's CommonJS React for browser development", async () => {
    const route = path.join(root, "app/route.jsx")
    mkdirSync(path.dirname(route), { recursive: true })
    writeFileSync(
      route,
      'import React from "react"; import { jsx } from "react/jsx-runtime"; export default jsx("div", { children: React.version });'
    )
    const server = await startManagedServer(
      { optimizeDeps: { entries: [route], force: true } },
      false
    )

    const client = server.environments.client
    const resolved = await client.pluginContainer.resolveId("react", route)
    const jsxRuntime = await client.pluginContainer.resolveId("react/jsx-runtime", route)
    const optimizer = client.depsOptimizer
    const dependency = [
      ...Object.values(optimizer?.metadata.optimized ?? {}),
      ...Object.values(optimizer?.metadata.discovered ?? {}),
    ].find((entry) => entry.id === "react")
    const expectedRoot = findManagedRuntimePackageRoot(ardoRoot, "react")

    expect(resolved?.id).toContain("/.vite/deps/react.js")
    expect(jsxRuntime?.id).toContain("/.vite/deps/react_jsx-runtime.js")
    expect(dependency).toBeDefined()
    expect(realpathSync(dependency!.src!)).toContain(realpathSync(expectedRoot!))
    await dependency?.processing
    expect(existsSync(dependency!.file)).toBe(true)

    const transformed = await client.transformRequest("/app/route.jsx")
    expect(transformed?.code).toContain("/node_modules/.vite/deps/react.js")
    expect(transformed?.code).not.toContain(appReactRoot)
  })

  it("uses source modules instead of cached optimizer output during scans", async () => {
    const route = path.join(root, "app/route.jsx")
    mkdirSync(path.dirname(route), { recursive: true })
    writeFileSync(route, 'import { jsx } from "react/jsx-runtime"; export default jsx("div", {});')
    const server = await startManagedServer(
      { optimizeDeps: { entries: [route], force: true } },
      false
    )
    type ResolveOptions = NonNullable<
      Parameters<typeof server.environments.client.pluginContainer.resolveId>[2]
    >
    const scanOptions: { scan: true } & ResolveOptions = { scan: true }
    const resolved = await server.environments.client.pluginContainer.resolveId(
      "react/jsx-runtime",
      route,
      scanOptions
    )
    const expectedRoot = findManagedRuntimePackageRoot(ardoRoot, "react")

    expect(resolved?.id).toBe(realpathSync(path.join(expectedRoot ?? "", "jsx-runtime.js")))
  })

  it("resolves manual client and SSR optimizer includes from Ardo's installation", async () => {
    const server = await startManagedServer(
      {
        optimizeDeps: {
          include: [
            "react",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-dom",
            "react-dom/client",
            "react-router",
            "react-router/dom",
            "lucide-react",
            "ardo > @base-ui/react/accordion",
            "ardo > @vanilla-extract/recipes/createRuntimeFn",
            "ardo > minisearch",
          ],
        },
        environments: {
          ssr: {
            optimizeDeps: {
              include: [
                "react",
                "react/jsx-runtime",
                "react/jsx-dev-runtime",
                "react-dom",
                "react-dom/server",
                "react-dom/static",
                "react-router",
                "lucide-react",
                "ardo > @base-ui/react/accordion",
                "ardo > @vanilla-extract/recipes/createRuntimeFn",
                "ardo > minisearch",
              ],
            },
          },
        },
      },
      false
    )

    const client = server.environments.client
    const ssr = server.environments.ssr
    const clientIncludes = [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "react-dom/static",
      "react-router",
      "react-router/dom",
      "lucide-react",
      "ardo > @base-ui/react/accordion",
      "ardo > @vanilla-extract/recipes/createRuntimeFn",
      "ardo > minisearch",
    ]
    const ssrIncludes = [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/server",
      "react-dom/static",
      "react-router",
      "lucide-react",
      "ardo > @base-ui/react/accordion",
      "ardo > @vanilla-extract/recipes/createRuntimeFn",
      "ardo > minisearch",
    ]
    const clientDeps = clientIncludes.map((id) => optimizedDependency(client, id))
    const ssrDeps = ssrIncludes.map((id) => optimizedDependency(ssr, id))

    await Promise.all(
      [...clientDeps, ...ssrDeps].map(async (dependency) => {
        await dependency?.processing
      })
    )

    const ardoModuleImporter = path.join(root, "node_modules/ardo/src/vite/managed-runtime.ts")
    const ssrJsxRuntime = await ssr.pluginContainer.resolveId(
      "react/jsx-runtime",
      ardoModuleImporter
    )
    expect(ssrJsxRuntime?.id).toContain("/.vite/deps_ssr/react_jsx-runtime.js")
    expect(findOptimizedDependencySource(ssrJsxRuntime?.id ?? "", ssr)).toContain(
      realpathSync(findArdoDependencyPackageRoot(ardoRoot, "react") ?? "")
    )

    for (const [index, dependency] of clientDeps.entries()) {
      expect(dependency, `client include ${clientIncludes[index]}`).toBeDefined()
      const source = dependency?.src
      const packageName = packageNameFromOptimizerId(clientIncludes[index] ?? "")
      const expectedRoot = findArdoDependencyPackageRoot(ardoRoot, packageName)
      expect(source).toBeDefined()
      expect(expectedRoot).toBeDefined()
      expect(realpathSync(source ?? "")).toContain(realpathSync(expectedRoot ?? ""))
    }
    for (const [index, dependency] of ssrDeps.entries()) {
      expect(dependency, `SSR include ${ssrIncludes[index]}`).toBeDefined()
      const source = dependency?.src
      const packageName = packageNameFromOptimizerId(ssrIncludes[index] ?? "")
      const expectedRoot = findArdoDependencyPackageRoot(ardoRoot, packageName)
      expect(source).toBeDefined()
      expect(expectedRoot).toBeDefined()
      expect(realpathSync(source ?? "")).toContain(realpathSync(expectedRoot ?? ""))
    }
    expect(
      path.basename(ssrDeps.find((dependency) => dependency?.id === "react-dom/server")?.src ?? "")
    ).toBe("server.node.js")
    expect(
      path.basename(ssrDeps.find((dependency) => dependency?.id === "react-dom/static")?.src ?? "")
    ).toBe("static.node.js")
  })

  it("keeps managed imports inside Ardo despite a consumer alias", async () => {
    const server = await startManagedServer({
      resolve: {
        alias: [
          { find: "react/jsx-runtime", replacement: path.join(appReactRoot, "jsx-runtime.js") },
        ],
      },
    })

    const resolved = await server.environments.client.pluginContainer.resolveId(
      "react/jsx-runtime",
      path.join(root, "app/route.jsx")
    )
    const sourcePath = findOptimizedDependencySource(resolved!.id, server.environments.client)

    expect(sourcePath).toContain(realpathSync(findManagedRuntimePackageRoot(ardoRoot, "react")!))
    expect(sourcePath).not.toContain(appReactRoot)
  })

  it("keeps the package boundary strict for unrelated ancestor imports", async () => {
    const server = await startManagedServer()

    await expect(
      server.environments.client.pluginContainer.resolveId(
        "ancestor-only",
        path.join(root, "app/route.jsx")
      )
    ).rejects.toThrow(/Undeclared dependency "ancestor-only"/u)
  })

  it("allows direct Ardo dependencies for Vite's synthetic HTML importer only", async () => {
    const server = await startManagedServer()
    const frameworkSearchPackage = findArdoDependencyPackageRoot(ardoRoot, "minisearch")
    const moduleFile = path.join(frameworkSearchPackage ?? "", "dist/es/index.js")
    const syntheticImporter = path.join(root, "index.html")

    expect(frameworkSearchPackage).toBeDefined()
    expect(existsSync(moduleFile)).toBe(true)
    await expect(
      server.environments.client.pluginContainer.resolveId(moduleFile, syntheticImporter, {
        isEntry: false,
      })
    ).resolves.not.toBeNull()
    await expect(
      server.environments.client.pluginContainer.resolveId(moduleFile, syntheticImporter, {
        isEntry: true,
      })
    ).rejects.toThrow(/Undeclared application dependency "minisearch"/u)

    writeFileSync(syntheticImporter, "<html></html>")
    await expect(
      server.environments.client.pluginContainer.resolveId(moduleFile, syntheticImporter, {
        isEntry: false,
      })
    ).rejects.toThrow(/Undeclared application dependency "minisearch"/u)
  })
})

async function createManagedServer(overrides: UserConfig = {}, excludeManaged = true) {
  const managedRuntimeExclude = excludeManaged ? [...getManagedRuntimePackageNames()] : []
  return createServer({
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    plugins: [
      createProjectBoundaryPlugin({ ardoRoot, managedRuntime: true }),
      createManagedRuntimePlugin({ ardoRoot }),
    ],
    optimizeDeps: { exclude: managedRuntimeExclude, noDiscovery: excludeManaged },
    resolve: { dedupe: ["react", "react-dom", "react-router"] },
    root,
    environments: {
      ssr: {
        optimizeDeps: { exclude: managedRuntimeExclude, noDiscovery: excludeManaged },
      },
    },
    server: { middlewareMode: true, watch: null },
    ssr: { noExternal: true },
    ...overrides,
  })
}

async function startManagedServer(overrides: UserConfig = {}, excludeManaged = true) {
  const server = await createManagedServer(overrides, excludeManaged)
  servers.push(server)
  return server
}

function optimizedDependency(environment: ViteDevServer["environments"]["client"], id: string) {
  const optimizer = environment.depsOptimizer
  return [
    ...Object.values(optimizer?.metadata.optimized ?? {}),
    ...Object.values(optimizer?.metadata.discovered ?? {}),
  ].find((entry) => entry.id === id)
}

function managedSourcePath(value: unknown, name: string): string | undefined {
  if (value == null || typeof value !== "object") return undefined
  const resolution = value as { name?: unknown; sourcePath?: unknown }
  return resolution.name === name && typeof resolution.sourcePath === "string"
    ? realpathSync(resolution.sourcePath)
    : undefined
}

function packageNameFromOptimizerId(id: string): string {
  const specifier = id.slice(id.lastIndexOf(">") + 1).trim()
  return specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/")
}

function writePackage(relativePath: string, manifest: object): string {
  const directory = path.join(parent, relativePath)
  mkdirSync(directory, { recursive: true })
  writeFileSync(path.join(directory, "package.json"), JSON.stringify(manifest))
  writeFileSync(path.join(directory, "index.js"), "export const value = 1")
  return directory
}
