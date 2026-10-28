import path from "node:path"
import { Readable } from "node:stream"
import type { ArdoServerRenderContext } from "ardo/runtime"
import { createServerI18nScope } from "@palamedes/runtime/server"
import { createViteCatalogDelivery } from "@palamedes/vite-plugin/delivery"

import { loadI18n, resolveLocale } from "./i18n/runtime"

const scope = createServerI18nScope()
const clientDirectory = path.resolve("build/client")
// Ardo moves assets below the version base before prerendering. Vite's manifest
// stays at the client root, while its asset paths stay relative to that base.
const assetDirectory = path.join(clientDirectory, import.meta.env.BASE_URL)
const delivery = createViteCatalogDelivery({
  clientDirectory: assetDirectory,
  manifestName: path.relative(
    assetDirectory,
    path.join(clientDirectory, "palamedes-split-manifest.json")
  ),
  development: import.meta.env.DEV,
})

/** Keep one locale across SSR, then deliver its catalog dependencies before client modules. */
export async function withRenderContext({ path: pathname, render }: ArdoServerRenderContext) {
  const locale = resolveLocale(pathname.split("/")[1])
  const i18n = await loadI18n(locale)
  const result = await scope.run(i18n, render)
  const document = Readable.from([result.html]).pipe(
    delivery.createDocumentTransform(delivery.getLocaleBinding(locale))
  )
  let html = ""
  for await (const chunk of document) html += String(chunk)
  return { ...result, html }
}
