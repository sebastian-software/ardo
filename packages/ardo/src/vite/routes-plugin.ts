import type { Plugin, ViteDevServer } from "vite"

import { existsSync, statSync } from "node:fs"
import path from "node:path"

import { findArdoPackageRoot } from "./managed-runtime"
import { getGitFileTimestamps } from "./git-utils"
import { isPathInsideDirectory, normalizePath, resolveRoutesDir } from "./path-utils"
import { type RouteInfo, scanRoutesSync } from "./routes-core"

export type ArdoRoutesPluginOptions = {
  /** Directory where routes are located (default: "./app/routes") */
  routesDir?: string
}

export const VIRTUAL_ROUTES_ID = "virtual:ardo/routes"
export const VIRTUAL_ENTRY_CLIENT_ID = "virtual:ardo/entry-client"
export const VIRTUAL_ENTRY_SERVER_ID = "virtual:ardo/entry-server"

const RESOLVED = {
  [VIRTUAL_ROUTES_ID]: `\0${VIRTUAL_ROUTES_ID}`,
  [VIRTUAL_ENTRY_CLIENT_ID]: `\0${VIRTUAL_ENTRY_CLIENT_ID}`,
  [VIRTUAL_ENTRY_SERVER_ID]: `\0${VIRTUAL_ENTRY_SERVER_ID}`,
} as const

type VirtualId = keyof typeof RESOLVED

/**
 * Provide the route table and Ardo's client and server entries as virtual
 * modules. Every file in the routes directory becomes a lazily loaded page.
 */
export function ardoRoutesPlugin(options: ArdoRoutesPluginOptions = {}): Plugin {
  let root = process.cwd()
  let routesDir = resolveRoutesDir(root, options.routesDir)

  return {
    name: "ardo:routes",
    enforce: "pre",

    configResolved(config) {
      root = config.root
      routesDir = resolveRoutesDir(root, options.routesDir)
    },

    resolveId(id) {
      return isVirtualId(id) ? RESOLVED[id] : undefined
    },

    load(id) {
      if (id === RESOLVED[VIRTUAL_ROUTES_ID]) {
        return createRoutesModule({ root, routesDir })
      }
      if (id === RESOLVED[VIRTUAL_ENTRY_CLIENT_ID]) {
        return `import ${JSON.stringify(resolveArdoEntry("client"))}\n`
      }
      if (id === RESOLVED[VIRTUAL_ENTRY_SERVER_ID]) {
        const serverContext = path.join(path.dirname(routesDir), "server.ts")
        const entry = JSON.stringify(resolveArdoEntry("server"))
        if (!existsSync(serverContext)) return `export * from ${entry}\n`
        return `import { renderPage as render } from ${entry};
import { withRenderContext } from ${JSON.stringify(normalizePath(serverContext))};
export { getStaticPaths, routes } from ${entry};
export const renderPage = (path, options) => withRenderContext({ path, render: () => render(path, options) });\n`
      }
      return null
    },

    configureServer(server) {
      server.watcher.add(routesDir)
      const handleChange = (changedPath: string) => {
        if (isRouteFile(changedPath, routesDir)) invalidateRoutes(server)
      }
      server.watcher.on("add", handleChange)
      server.watcher.on("unlink", handleChange)
    },
  }
}

/** Generate the route table module for the routes in `routesDir`. */
export function createRoutesModule({ root, routesDir }: { root: string; routesDir: string }) {
  const routes = scanRoutesSync({ dir: routesDir, rootDir: routesDir })
  const timestamps = getGitFileTimestamps(routesDir)
  const rootFile = path.join(path.dirname(routesDir), "root.tsx")
  const rootImport = existsSync(rootFile)
    ? `import * as rootModule from ${JSON.stringify(normalizePath(rootFile))}`
    : "const rootModule = {}"
  const entries = sortRoutes(routes).map((route) => {
    const relativePath = normalizePath(path.relative(routesDir, route.filePath))
    const source = {
      relativePath,
      lastUpdated: timestamps.get(relativePath) ?? statSync(route.filePath).mtimeMs,
    }
    return `  { id: ${JSON.stringify(toRouteId(root, route))}, path: ${JSON.stringify(route.path)}, load: () => import(${JSON.stringify(normalizePath(route.filePath))}), source: ${JSON.stringify(source)} },`
  })
  // The root module's CSS comes first, so a cascade-layer order it declares,
  // such as Tailwind's, also places Ardo's `ardo` layer. Unlayered site CSS
  // beats that layer whatever the order.
  return `${rootImport}\nimport "ardo/ui/styles.css"\nexport { rootModule }\nexport const routes = [\n${entries.join("\n")}\n]\n`
}

/** Route id: the route file relative to the project root, as Vite's manifest keys it. */
export function toRouteId(root: string, route: Pick<RouteInfo, "filePath">): string {
  return normalizePath(path.relative(root, route.filePath))
}

/**
 * Path of one of Ardo's entries. Published builds use `dist`; Ardo's own tests
 * run from source.
 */
export function resolveArdoEntry(name: "client" | "server"): string {
  if (/\.tsx?$/u.test(import.meta.filename)) {
    return path.join(import.meta.dirname, "../entries", `${name}.tsx`)
  }
  return path.join(findArdoPackageRoot(), "dist/entries", `${name}.js`)
}

function sortRoutes(routes: RouteInfo[]): RouteInfo[] {
  return [...routes].sort((left, right) => left.path.localeCompare(right.path))
}

function isVirtualId(id: string): id is VirtualId {
  return Object.hasOwn(RESOLVED, id)
}

function isRouteFile(changedPath: string, routesDir: string): boolean {
  const normalizedPath = normalizePath(changedPath)
  return (
    isPathInsideDirectory(normalizedPath, routesDir) &&
    (normalizedPath.endsWith(".md") ||
      normalizedPath.endsWith(".mdx") ||
      normalizedPath.endsWith(".tsx"))
  )
}

function invalidateRoutes(server: ViteDevServer): void {
  for (const environment of Object.values(server.environments)) {
    const module = environment.moduleGraph.getModuleById(RESOLVED[VIRTUAL_ROUTES_ID])
    if (module != null) environment.moduleGraph.invalidateModule(module)
  }
  server.ws.send({ type: "full-reload" })
}
