import type { Plugin, ViteDevServer } from "vite"

import { existsSync, statSync } from "node:fs"
import path from "node:path"
import type { ResolvedConfig } from "../config/types"
import { resolveRoutePublicPath } from "../shared/route-links"

import { findArdoPackageRoot } from "./managed-runtime"
import { getGitFileTimestamps, sourceHistoryDirectory } from "./git-utils"
import { isPathInsideDirectory, normalizePath, resolveRoutesDir } from "./path-utils"
import { type RouteInfo, scanRoutesSync } from "./routes-core"

export type ArdoRoutesPluginOptions = {
  /** Directory where routes are located (default: "./app/routes") */
  routesDir?: string
}

export const VIRTUAL_ROUTES_ID = "virtual:ardo/routes"
/** The root module and every logical route path: what the client entry needs for links. */
export const VIRTUAL_CLIENT_ROUTES_ID = "virtual:ardo/client-routes"
/** Route id to page module loader, imported lazily when a page names no module URL. */
export const VIRTUAL_PAGE_LOADERS_ID = "virtual:ardo/page-loaders"
export const VIRTUAL_ENTRY_CLIENT_ID = "virtual:ardo/entry-client"
export const VIRTUAL_ENTRY_SERVER_ID = "virtual:ardo/entry-server"

const RESOLVED = {
  [VIRTUAL_ROUTES_ID]: `\0${VIRTUAL_ROUTES_ID}`,
  [VIRTUAL_CLIENT_ROUTES_ID]: `\0${VIRTUAL_CLIENT_ROUTES_ID}`,
  [VIRTUAL_PAGE_LOADERS_ID]: `\0${VIRTUAL_PAGE_LOADERS_ID}`,
  [VIRTUAL_ENTRY_CLIENT_ID]: `\0${VIRTUAL_ENTRY_CLIENT_ID}`,
  [VIRTUAL_ENTRY_SERVER_ID]: `\0${VIRTUAL_ENTRY_SERVER_ID}`,
} as const

type VirtualId = keyof typeof RESOLVED

/**
 * Provide the route table and Ardo's client and server entries as virtual
 * modules. Every file in the routes directory becomes a lazily loaded page.
 * The server renders from the full route table. The client entry carries only
 * the logical paths and loads the page module the server names; the loader
 * table is a separate, lazily imported chunk for pages without that URL.
 */
export function ardoRoutesPlugin(
  options: ArdoRoutesPluginOptions = {},
  state?: { resolvedConfig?: ResolvedConfig }
): Plugin {
  let root = process.cwd()
  let routesDir = resolveRoutesDir(root, options.routesDir)
  const scan = createRouteScan(() => routesDir)

  return {
    name: "ardo:routes",
    enforce: "pre",

    configResolved(config) {
      root = config.root
      routesDir = resolveRoutesDir(root, options.routesDir)
      scan.reset()
    },

    resolveId(id) {
      return isVirtualId(id) ? RESOLVED[id] : undefined
    },

    load(id) {
      if (id === RESOLVED[VIRTUAL_ROUTES_ID]) {
        const routes = scan.read(this.environment?.name, id)
        return createRoutesModule({ root, routesDir, config: state?.resolvedConfig, routes })
      }
      if (id === RESOLVED[VIRTUAL_CLIENT_ROUTES_ID]) {
        return createClientRoutesModule({
          routesDir,
          routes: scan.read(this.environment?.name, id),
        })
      }
      if (id === RESOLVED[VIRTUAL_PAGE_LOADERS_ID]) {
        return createPageLoadersModule({
          root,
          routesDir,
          routes: scan.read(this.environment?.name, id),
        })
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
        if (isRouteFile(changedPath, routesDir) || isRootFile(changedPath, routesDir))
          invalidateRoutes(server, scan)
      }
      server.watcher.on("add", handleChange)
      server.watcher.on("unlink", handleChange)
    },
  }
}

/**
 * Generate the full route table module for the routes in `routesDir`, which only the server
 * entry imports. `routes` is a scan of that directory; without it the directory is scanned.
 */
export function createRoutesModule({
  root,
  routesDir,
  config,
  routes = scanRoutesSync({ dir: routesDir, rootDir: routesDir }),
}: {
  root: string
  routesDir: string
  config?: ResolvedConfig
  routes?: readonly RouteInfo[]
}) {
  // Keys are relative to the routes directory, which a staged copy shares with its source.
  const timestamps = getGitFileTimestamps(sourceHistoryDirectory(routesDir, config))
  const publicPaths = new Map<string, string>()
  const entries = sortRoutes(routes).map((route) => {
    const relativePath = normalizePath(path.relative(routesDir, route.filePath))
    const source = {
      relativePath,
      lastUpdated: timestamps.get(relativePath) ?? statSync(route.filePath).mtimeMs,
    }
    let mountedPath = route.path
    let identityFields = ""
    // The browser derives the same public path from the logical path for links.
    const publicPath = resolveRoutePublicPath(route.path, config)
    if (config != null && publicPath != null) {
      mountedPath = `/${publicPath.slice(config.base.length)}`.replace(/\/$/u, "") || "/"
      identityFields = `logicalPath: ${JSON.stringify(route.path)}, publicPath: ${JSON.stringify(publicPath)}, `
    }
    const collision = publicPaths.get(mountedPath)
    if (collision != null)
      throw new Error(
        `[ardo] Multiple routes resolve to the same public URL ${mountedPath}: ${collision} and ${route.filePath}.`
      )
    publicPaths.set(mountedPath, route.filePath)
    return `  { id: ${JSON.stringify(toRouteId(root, route))}, path: ${JSON.stringify(mountedPath)}, ${identityFields}load: () => import(${JSON.stringify(normalizePath(route.filePath))}), source: ${JSON.stringify(source)} },`
  })
  return `${createRootPrelude(routesDir)}export { rootModule }\nexport const routes = [\n${entries.join("\n")}\n]\n`
}

/**
 * Generate the client's route module: the root module and the logical path of
 * every route, in route table order. Links derive their public addresses from
 * these paths on both render sides, so the server imports them from here too.
 */
export function createClientRoutesModule({
  routesDir,
  routes = scanRoutesSync({ dir: routesDir, rootDir: routesDir }),
}: {
  routesDir: string
  routes?: readonly RouteInfo[]
}): string {
  const paths = sortRoutes(routes).map((route) => route.path)
  return `${createRootPrelude(routesDir)}export { rootModule }\nexport const paths = ${JSON.stringify(paths)}\n`
}

/**
 * Generate the map from route id to a lazy import of its page. Each import
 * keeps the page a dynamic entry of the client build, with its own chunk.
 */
export function createPageLoadersModule({
  root,
  routesDir,
  routes = scanRoutesSync({ dir: routesDir, rootDir: routesDir }),
}: {
  root: string
  routesDir: string
  routes?: readonly RouteInfo[]
}): string {
  const loaders = sortRoutes(routes).map(
    (route) =>
      `  ${JSON.stringify(toRouteId(root, route))}: () => import(${JSON.stringify(normalizePath(route.filePath))}),`
  )
  return `export default {\n${loaders.join("\n")}\n}\n`
}

/**
 * Import the root module and Ardo's stylesheet, in that order. The root
 * module's CSS comes first, so a cascade-layer order it declares, such as
 * Tailwind's, also places Ardo's `ardo` layer. Unlayered site CSS beats that
 * layer whatever the order.
 */
function createRootPrelude(routesDir: string): string {
  const rootFile = rootFilePath(routesDir)
  // Without app/root.tsx the site is `<ArdoRoot />`, which is a complete site.
  // Only such sites import it here, so a custom root never bundles it.
  const rootImport = existsSync(rootFile)
    ? `import * as rootModule from ${JSON.stringify(normalizePath(rootFile))}`
    : 'import { ArdoRoot } from "ardo/ui"\nconst rootModule = { default: ArdoRoot }'
  return `${rootImport}\nimport "ardo/ui/styles.css"\n`
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

function sortRoutes(routes: readonly RouteInfo[]): RouteInfo[] {
  // A fixed locale keeps the route table, and so the built chunks, the same on every machine.
  return [...routes].sort((left, right) => left.path.localeCompare(right.path, "en"))
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

function rootFilePath(routesDir: string): string {
  return path.join(path.dirname(routesDir), "root.tsx")
}

/** Adding or deleting app/root.tsx switches between it and the `<ArdoRoot />` fallback. */
function isRootFile(changedPath: string, routesDir: string): boolean {
  return normalizePath(changedPath) === normalizePath(rootFilePath(routesDir))
}

/** The modules generated from the routes directory, in every environment. */
const ROUTE_MODULE_IDS = [
  RESOLVED[VIRTUAL_ROUTES_ID],
  RESOLVED[VIRTUAL_CLIENT_ROUTES_ID],
  RESOLVED[VIRTUAL_PAGE_LOADERS_ID],
]

/**
 * One scan of the routes directory, shared by the three route modules, so a server route
 * table, client paths and page loaders built from one scan always list the same routes. A new
 * scan starts when the routes are invalidated, or when an environment loads a route module it
 * already loaded from the current scan: the module graph invalidated it, as other Ardo plugins
 * do after regenerating route files.
 */
function createRouteScan(routesDir: () => string): {
  read: (environment: string | undefined, id: string) => readonly RouteInfo[]
  reset: () => void
} {
  let routes: readonly RouteInfo[] | undefined
  const served = new Set<string>()
  const reset = () => {
    routes = undefined
    served.clear()
  }
  return {
    read(environment, id) {
      const key = `${environment ?? ""} ${id}`
      if (served.has(key)) reset()
      served.add(key)
      routes ??= scanRoutesSync({ dir: routesDir(), rootDir: routesDir() })
      return routes
    },
    reset,
  }
}

function invalidateRoutes(server: ViteDevServer, scan: { reset: () => void }): void {
  scan.reset()
  for (const environment of Object.values(server.environments)) {
    for (const id of ROUTE_MODULE_IDS) {
      const module = environment.moduleGraph.getModuleById(id)
      if (module != null) environment.moduleGraph.invalidateModule(module)
    }
  }
  server.ws.send({ type: "full-reload" })
}
