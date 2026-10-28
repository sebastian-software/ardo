import type { ViteDevServer } from "vite"
import type { ResolvedConfig } from "../config/types"
import { isPathInsideDirectory, normalizePath } from "./path-utils"
import {
  RESOLVED_IDS,
  VIRTUAL_COLLECTIONS_ID,
  VIRTUAL_GENERATED_SIDEBARS_ID,
  VIRTUAL_SEARCH_ID,
} from "./virtual-modules"

export function configureVirtualModuleInvalidation(
  server: ViteDevServer,
  state: { routesDir: string; resolvedConfig?: ResolvedConfig }
): void {
  server.watcher.add(state.routesDir)

  const handleRouteContentChange = (changedPath: string) => {
    if (!shouldInvalidateRouteVirtualModules(changedPath, state.routesDir)) {
      return
    }

    invalidateVirtualModules(server, state.resolvedConfig)
    server.ws.send({ type: "full-reload" })
  }

  server.watcher.on("add", handleRouteContentChange)
  server.watcher.on("change", handleRouteContentChange)
  server.watcher.on("unlink", handleRouteContentChange)
}

function shouldInvalidateRouteVirtualModules(changedPath: string, routesDir: string): boolean {
  const normalizedPath = normalizePath(changedPath)
  return (
    isPathInsideDirectory(normalizedPath, routesDir) &&
    (normalizedPath.endsWith(".md") || normalizedPath.endsWith(".mdx"))
  )
}

function invalidateVirtualModules(server: ViteDevServer, config: ResolvedConfig | undefined): void {
  const virtualIds = [
    RESOLVED_IDS[VIRTUAL_COLLECTIONS_ID],
    RESOLVED_IDS[VIRTUAL_GENERATED_SIDEBARS_ID],
    RESOLVED_IDS[VIRTUAL_SEARCH_ID],
    ...(config?.i18n === false || config?.i18n == null
      ? []
      : config.i18n.locales.map(
          ({ id }) => `${RESOLVED_IDS[VIRTUAL_SEARCH_ID]}?locale=${encodeURIComponent(id)}`
        )),
  ]

  for (const environment of Object.values(server.environments)) {
    for (const id of virtualIds) {
      const module = environment.moduleGraph.getModuleById(id)
      if (module != null) environment.moduleGraph.invalidateModule(module)
    }
  }
}
