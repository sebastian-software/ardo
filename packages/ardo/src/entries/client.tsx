import { hydrateRoot } from "react-dom/client"
import { paths, rootModule } from "virtual:ardo/client-routes"
import virtualConfig from "virtual:ardo/config"
import type { ResolvedConfig } from "../config/types"

import { ArdoApp } from "../runtime/app"
import { showClientRecovery } from "../runtime/client-recovery"
import {
  ARDO_APP_ELEMENT_ID,
  ARDO_PAGE_DATA_ATTRIBUTE,
  type ArdoPageData,
  type ArdoPageRoute,
  type ArdoRootModule,
  type ArdoRouteModule,
  loadPageModule,
  resolvePage,
} from "../runtime/routing"

const config: ResolvedConfig = virtualConfig
const root: ArdoRootModule = rootModule
const container = document.getElementById(ARDO_APP_ELEMENT_ID)
const pageData = container?.getAttribute(ARDO_PAGE_DATA_ATTRIBUTE)

// Hydrate with the same route module the server rendered for this page. The
// entry knows the logical paths of all routes, not their modules.
if (container != null && pageData != null) {
  let homeHref = config.base ?? "/"
  const recover = (preserveContent: boolean) =>
    showClientRecovery({
      container,
      preserveContent,
      homeHref,
      customize: root.clientRecovery,
    })
  let hydrating = false
  try {
    // The server wrote this description of the page it rendered.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const data = JSON.parse(pageData) as ArdoPageData
    if (typeof data.base === "string") homeHref = data.base
    const locale =
      config.i18n === false
        ? undefined
        : config.i18n?.locales.find(({ id }) => id === data.path?.split("/")[1])
    if (locale != null) homeHref += `${locale.id}/`
    const { routeId } = data
    // The entry holds no route table: a build names the page's own chunk, and
    // only pages without that URL fetch the loader table.
    const route: ArdoPageRoute | undefined =
      routeId == null
        ? undefined
        : {
            id: routeId,
            load: async () =>
              loadPageModule(
                { module: data.module, routeId },
                {
                  baseURI: document.baseURI,
                  events: globalThis,
                  importModule: async (url) =>
                    // The server wrote the URL of a page chunk Vite built.
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    (await import(/* @vite-ignore */ url)) as ArdoRouteModule,
                  async importLoaders() {
                    const loaders = await import("virtual:ardo/page-loaders")
                    return loaders.default
                  },
                }
              ),
          }
    const page = await resolvePage({ ...data, root, route, siteTitle: config.title })
    hydrating = true
    hydrateRoot(container, <ArdoApp config={config} page={page} paths={paths} root={root} />, {
      onUncaughtError() {
        // Let React finish clearing the failed tree before mounting independent native controls.
        queueMicrotask(() => recover(false))
      },
      // React handles recoverable hydration mismatches itself. Do not replace usable content.
    })
  } catch {
    recover(!hydrating)
  }
}
